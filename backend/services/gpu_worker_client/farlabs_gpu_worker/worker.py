from __future__ import annotations

import asyncio
import contextlib
import logging
import time
from typing import Any, Dict, Optional

from .api import PlatformApiClient
from .config import RegistrationPayload, WorkerSettings
from .executor import BaseExecutor, ExecutionResult
from .hardware import collect_gpu_metrics
from .queue import TaskQueue

logger = logging.getLogger(__name__)


class GPUWorker:
  """Coordinates registration, heartbeat, queue polling, and execution."""

  def __init__(
    self,
    settings: WorkerSettings,
    api_client: PlatformApiClient,
    task_queue: TaskQueue,
    executor: BaseExecutor,
  ) -> None:
    self.settings = settings
    self.api_client = api_client
    self.task_queue = task_queue
    self.executor = executor

    self.node_id: Optional[str] = settings.node_id
    self._status = "offline"
    self._tasks_completed = 0
    self._start_time = time.monotonic()
    self._heartbeat_event = asyncio.Event()
    self._shutdown = asyncio.Event()
    self._last_latency_ms: Optional[float] = None
    self._last_tokens_per_second: Optional[float] = None

  async def run(self) -> None:
    await self.executor.setup()
    if not self.node_id:
      payload = RegistrationPayload.from_settings(self.settings)
      response = await self.api_client.register_node(payload.__dict__)
      self.node_id = response["node_id"]
      logger.info("Node registered: %s", self.node_id)
    else:
      logger.info("Using existing node id: %s", self.node_id)

    if not self.node_id:
      raise RuntimeError("Failed to determine node id")

    self.task_queue.set_node_id(self.node_id)
    await self.task_queue.connect()

    self._status = "available"
    self._start_time = time.monotonic()
    self._heartbeat_event.set()

    heartbeat_task = asyncio.create_task(self._heartbeat_loop(), name="heartbeat")

    try:
      await self._main_loop()
    except asyncio.CancelledError:
      raise
    finally:
      await self.task_queue.close()
      await self.executor.shutdown()
      self._shutdown.set()
      heartbeat_task.cancel()
      with contextlib.suppress(Exception):
        await heartbeat_task

  async def _main_loop(self) -> None:
    while True:
      task = await self.task_queue.next_task()
      if task is None:
        continue
      await self._process_task(task)

  async def _process_task(self, task: Dict[str, Any]) -> None:
    task_id = task.get("task_id")
    if not task_id:
      logger.warning("Skipping task with missing task_id: %s", task)
      return

    logger.info("Processing task %s", task_id)
    self._set_status("busy")
    await self.task_queue.publish_status(
      task_id,
      {"status": "running", "message": "Task accepted by GPU worker", "node_id": self.node_id},
    )

    try:
      interim_payload = {"status": "running", "message": "Executing prompt", "progress": 0.25}
      await self.task_queue.publish_status(task_id, interim_payload)

      start = time.perf_counter()

      async def progress_callback(update: Dict[str, Any]) -> None:
        payload = {
          "status": "running",
          "node_id": self.node_id,
        }
        payload.update(update)
        await self.task_queue.publish_status(task_id, payload)

      result = await self.executor.execute(task, progress_callback=progress_callback)
      latency_ms = (time.perf_counter() - start) * 1000
      self._record_metrics(latency_ms, result.tokens_per_second)
      await self._publish_result(task_id, result, latency_ms)
      logger.info(
        "Task %s completed in %.2f ms (%.2f tokens/sec)",
        task_id,
        latency_ms,
        result.tokens_per_second,
      )
      self._tasks_completed += 1
    except Exception as exc:  # pragma: no cover - runtime path
      logger.exception("Task %s failed: %s", task_id, exc)
      await self.task_queue.publish_status(
        task_id,
        {"status": "failed", "error": str(exc), "node_id": self.node_id},
      )
    finally:
      self._set_status("available")

  async def _publish_result(self, task_id: str, result: ExecutionResult, latency_ms: float) -> None:
    payload = {
      "status": result.status,
      "text": result.text,
      "tokens_generated": result.tokens_generated,
      "tokens_per_second": result.tokens_per_second,
      "accuracy": result.accuracy,
      "node_id": self.node_id,
      "latency_ms": round(latency_ms, 2),
    }
    await self.task_queue.publish_status(task_id, payload)

  def _set_status(self, status: str) -> None:
    self._status = status
    self._heartbeat_event.set()

  def _record_metrics(self, latency_ms: float, tokens_per_second: float) -> None:
    self._last_latency_ms = latency_ms
    self._last_tokens_per_second = tokens_per_second

  async def _heartbeat_loop(self) -> None:
    try:
      while not self._shutdown.is_set():
        try:
          await asyncio.wait_for(
            self._heartbeat_event.wait(),
            timeout=self.settings.heartbeat_interval,
          )
        except asyncio.TimeoutError:
          pass
        self._heartbeat_event.clear()

        if not self.node_id:
          continue
        uptime_seconds = int(time.monotonic() - self._start_time)
        payload = {
          "status": self._status,
          "uptime_seconds": uptime_seconds,
          "tasks_completed": self._tasks_completed,
        }

        gpu_stats = collect_gpu_metrics()
        if "temperature_c" in gpu_stats:
          payload["temperature_c"] = gpu_stats.pop("temperature_c")
        payload.update(gpu_stats)
        if self._last_latency_ms is not None:
          payload["last_latency_ms"] = round(self._last_latency_ms, 2)
        if self._last_tokens_per_second is not None:
          payload["last_tokens_per_second"] = round(self._last_tokens_per_second, 2)
        try:
          await self.api_client.send_heartbeat(self.node_id, payload)
        except Exception as exc:  # pragma: no cover - runtime path
          logger.warning("Heartbeat failed: %s", exc)
    finally:
      logger.info("Heartbeat loop terminated")

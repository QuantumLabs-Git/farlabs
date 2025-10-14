from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

import redis.asyncio as redis  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)


class TaskQueue:
  """Wrapper around Redis queues used for inference tasks."""

  def __init__(
    self,
    redis_url: str,
    *,
    primary_queue: str,
    node_id: Optional[str] = None,
    backoff_seconds: float = 1.5,
    poll_timeout: int = 5,
  ) -> None:
    self._redis_url = redis_url
    self._primary_queue = primary_queue
    self._node_id = node_id
    self._backoff = backoff_seconds
    self._poll_timeout = poll_timeout
    self._client: Optional[redis.Redis] = None

  async def connect(self) -> None:
    self._client = redis.from_url(self._redis_url, decode_responses=True)

  async def close(self) -> None:
    if self._client:
      await self._client.close()
      self._client = None

  def set_node_id(self, node_id: str) -> None:
    self._node_id = node_id

  @property
  def _queue_keys(self) -> List[str]:
    keys = []
    if self._node_id:
      keys.append(f"{self._primary_queue}:{self._node_id}")
    keys.append(self._primary_queue)
    return keys

  async def next_task(self) -> Optional[Dict[str, Any]]:
    if not self._client:
      raise RuntimeError("TaskQueue not connected")

    while True:
      try:
        result = await self._client.brpop(self._queue_keys, timeout=self._poll_timeout)
      except (redis.ConnectionError, redis.TimeoutError) as exc:
        logger.warning("Redis connection issue: %s", exc)
        await asyncio.sleep(self._backoff)
        continue

      if result is None:
        return None

      queue_name, payload = result
      try:
        task = json.loads(payload)
      except json.JSONDecodeError:
        logger.error("Discarding malformed task payload: %s", payload)
        continue

      if queue_name == self._primary_queue and self._node_id and task.get("node_id") != self._node_id:
        await self._client.lpush(queue_name, payload)
        await asyncio.sleep(self._backoff)
        continue

      return task

  async def publish_status(self, task_id: str, payload: Dict[str, Any]) -> None:
    if not self._client:
      raise RuntimeError("TaskQueue not connected")
    channel = f"task:{task_id}"
    await self._client.publish(channel, json.dumps(payload))

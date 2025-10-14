from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from .api import PlatformApiClient
from .auth import TokenManager
from .config import WorkerSettings
from .executor import build_executor
from .queue import TaskQueue
from .worker import GPUWorker


async def _run_worker(args: argparse.Namespace) -> None:
  settings = WorkerSettings.from_env()
  logging.getLogger("httpx").setLevel(logging.WARNING)
  logging.getLogger("redis").setLevel(logging.WARNING)

  token_manager = TokenManager(
    base_url=settings.api_base_url,
    initial_token=settings.api_token,
    wallet_address=settings.auth_wallet_address,
    refresh_enabled=settings.auth_refresh_enabled,
    refresh_endpoint=settings.auth_refresh_endpoint,
    leeway_seconds=settings.auth_refresh_leeway_seconds,
    timeout=settings.api_timeout_seconds,
    verify_tls=settings.api_verify_tls,
    ca_bundle=settings.api_ca_bundle,
  )

  executor = build_executor(
    settings.executor,
    model_map=settings.executor_model_map,
    device=settings.executor_device,
    dtype=settings.executor_dtype,
    model_cache_dir=settings.model_cache_dir,
    trust_remote_code=settings.trust_remote_code,
  )
  task_queue = TaskQueue(
    settings.redis_url,
    primary_queue=settings.queue_name,
    backoff_seconds=settings.queue_backoff_seconds,
    poll_timeout=settings.poll_timeout_seconds,
  )

  async with PlatformApiClient(
    settings.api_base_url,
    token_manager,
    timeout=settings.api_timeout_seconds,
    verify_tls=settings.api_verify_tls,
    ca_bundle=settings.api_ca_bundle,
  ) as api_client:
    worker = GPUWorker(settings, api_client, task_queue, executor)
    await worker.run()


def main(argv: list[str] | None = None) -> None:
  parser = argparse.ArgumentParser(
    prog="farlabs-gpu-worker",
    description="Connect a GPU provider node to the Far Labs inference mesh.",
  )
  parser.add_argument(
    "--log-level",
    default="INFO",
    choices=["DEBUG", "INFO", "WARNING", "ERROR"],
    help="Logging verbosity (default: INFO)",
  )
  parser.add_argument(
    "command",
    nargs="?",
    default="run",
    choices=["run"],
    help="Command to execute (default: run)",
  )
  args = parser.parse_args(argv)

  logging.basicConfig(
    level=getattr(logging, args.log_level),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
  )

  try:
    asyncio.run(_run_worker(args))
  except KeyboardInterrupt:
    print("\nInterrupted, shutting down…", file=sys.stderr)


if __name__ == "__main__":
  main()

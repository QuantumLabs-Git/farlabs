from __future__ import annotations

import asyncio
import random
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, Optional


@dataclass
class ExecutionResult:
  status: str
  text: str
  tokens_generated: int
  tokens_per_second: float
  accuracy: float = 0.0


class BaseExecutor:
  """Interface for GPU execution backends."""

  async def setup(self) -> None:  # pragma: no cover - optional override
    return None

  async def execute(
    self,
    task: Dict[str, Any],
    progress_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
  ) -> ExecutionResult:
    raise NotImplementedError

  async def shutdown(self) -> None:  # pragma: no cover - optional override
    return None


class MockExecutor(BaseExecutor):
  """Simulates inference locally; useful for dry-runs and CI."""

  def __init__(self, *, min_latency: float = 0.5, max_latency: float = 1.5, **_: Any) -> None:
    self._min_latency = min_latency
    self._max_latency = max_latency

  async def execute(
    self,
    task: Dict[str, Any],
    progress_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
  ) -> ExecutionResult:
    await asyncio.sleep(random.uniform(self._min_latency, self._max_latency))
    prompt = task.get("prompt", "")
    model_id = task.get("model", "unknown-model")
    summary = prompt[:240] + ("…" if len(prompt) > 240 else "")
    tokens_budget = int(task.get("max_tokens", 1000))
    tokens_generated = min(
      int(tokens_budget * random.uniform(0.4, 0.9)),
      max(tokens_budget, 32),
    )
    tokens_per_second = max(random.uniform(20, 60), 10.0)
    text = (
      f"[{model_id}] Synthetic completion\n\nPrompt excerpt:\n{summary}\n\n"
      "Replace the executor to stream results from a real model."
    )
    if progress_callback:
      await progress_callback(
        {
          "delta": text,
          "tokens_generated": tokens_generated,
          "tokens_per_second": tokens_per_second,
        }
      )
    return ExecutionResult(
      status="completed",
      text=text,
      tokens_generated=tokens_generated,
      tokens_per_second=tokens_per_second,
      accuracy=round(random.uniform(0.92, 0.99), 3),
    )


class HuggingFaceExecutor(BaseExecutor):
  """Runs inference using Hugging Face transformers on the local GPU."""

  def __init__(
    self,
    model_map: Dict[str, str],
    *,
    device: str = "auto",
    dtype: Optional[str] = None,
    model_cache_dir: Optional[str] = None,
    trust_remote_code: bool = False,
  ) -> None:
    try:
      import torch  # noqa: F401
      from transformers import AutoModelForCausalLM, AutoTokenizer  # noqa: F401
    except ImportError as exc:  # pragma: no cover - runtime dependency
      raise RuntimeError(
        "The HuggingFace executor requires 'torch' and 'transformers' packages."
      ) from exc

    self._model_map = model_map
    self._device = device
    self._dtype = dtype
    self._model_cache_dir = model_cache_dir
    self._trust_remote_code = trust_remote_code
    self._pipelines: Dict[str, Any] = {}
    self._lock = asyncio.Lock()

  async def execute(
    self,
    task: Dict[str, Any],
    progress_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
  ) -> ExecutionResult:
    import queue
    import torch
    from transformers import pipeline, TextIteratorStreamer

    model_id = task.get("model")
    if not model_id:
      raise ValueError("Task is missing model identifier")

    repo_id = self._resolve_model(model_id)
    pipe = await self._get_pipeline(repo_id)

    prompt = task.get("prompt", "")
    max_tokens = int(task.get("max_tokens", 512))
    temperature = float(task.get("temperature", 0.7))

    generate_kwargs = {
      "max_new_tokens": max_tokens,
      "temperature": temperature,
      "do_sample": temperature > 0,
      "return_full_text": False,
    }
    streamer = TextIteratorStreamer(
      pipe.tokenizer, skip_prompt=True, skip_special_tokens=True
    )
    generate_kwargs["streamer"] = streamer

    loop = asyncio.get_running_loop()
    start = time.perf_counter()
    generation_task = loop.run_in_executor(
      None, lambda: pipe(prompt, **generate_kwargs)
    )

    accumulated_text: list[str] = []
    tokenizer = pipe.tokenizer
    prompt_tokens = tokenizer.encode(prompt, add_special_tokens=False)
    total_generated_tokens = 0

    while True:
      try:
        chunk = await loop.run_in_executor(
          None, streamer.text_queue.get, True, 0.1
        )
      except queue.Empty:  # type: ignore[attr-defined]
        if streamer.end_of_stream:
          break
        continue
      if chunk:
        accumulated_text.append(chunk)
        if progress_callback:
          text_so_far = "".join(accumulated_text)
          full_tokens = tokenizer.encode(text_so_far, add_special_tokens=False)
          generated_tokens = max(len(full_tokens) - len(prompt_tokens), 0)
          total_generated_tokens = generated_tokens
          await progress_callback(
            {
              "delta": chunk,
              "tokens_generated": generated_tokens,
            }
          )
      if streamer.end_of_stream and streamer.text_queue.empty():
        break

    await generation_task
    generated_text = "".join(accumulated_text)
    full_tokens_final = tokenizer.encode(generated_text, add_special_tokens=False)
    total_generated_tokens = max(len(full_tokens_final) - len(prompt_tokens), 0)

    elapsed = max(time.perf_counter() - start, 1e-3)
    tokens_per_second = (
      total_generated_tokens / elapsed if total_generated_tokens else 0.0
    )

    if progress_callback and generated_text:
      await progress_callback(
        {
          "tokens_generated": total_generated_tokens,
          "final": True,
        }
      )

    return ExecutionResult(
      status="completed",
      text=generated_text,
      tokens_generated=total_generated_tokens,
      tokens_per_second=tokens_per_second,
      accuracy=0.0,
    )

  async def _get_pipeline(self, repo_id: str):
    if repo_id in self._pipelines:
      return self._pipelines[repo_id]

    async with self._lock:
      if repo_id in self._pipelines:
        return self._pipelines[repo_id]

      from transformers import pipeline

      kwargs: Dict[str, Any] = {
        "model": repo_id,
        "device_map": self._device,
        "torch_dtype": self._dtype_resolver(),
        "trust_remote_code": self._trust_remote_code,
      }
      if self._model_cache_dir:
        kwargs["cache_dir"] = self._model_cache_dir

      pipe = await asyncio.get_running_loop().run_in_executor(
        None,
        lambda: pipeline("text-generation", **kwargs),
      )

      self._pipelines[repo_id] = pipe
      return pipe

  def _resolve_model(self, model_id: str) -> str:
    repo_id = self._model_map.get(model_id)
    if not repo_id:
      raise ValueError(f"No model mapping configured for '{model_id}'")
    return repo_id

  def _dtype_resolver(self):
    if not self._dtype:
      return None
    import torch

    dtype_map = {
      "float32": torch.float32,
      "float16": torch.float16,
      "half": torch.float16,
      "bfloat16": torch.bfloat16,
    }
    key = self._dtype.lower()
    if key not in dtype_map:
      raise ValueError(f"Unsupported torch dtype '{self._dtype}'")
    return dtype_map[key]


EXECUTOR_IMPLEMENTATIONS = {
  "mock": MockExecutor,
  "huggingface": HuggingFaceExecutor,
}


def build_executor(kind: str, **kwargs: Any) -> BaseExecutor:
  factory = EXECUTOR_IMPLEMENTATIONS.get(kind.lower())
  if not factory:
    available = ", ".join(sorted(EXECUTOR_IMPLEMENTATIONS))
    raise ValueError(f"Unknown executor '{kind}'. Available: {available}")
  return factory(**kwargs)

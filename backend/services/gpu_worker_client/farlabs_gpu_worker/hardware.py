from __future__ import annotations

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def collect_gpu_metrics() -> Dict[str, Any]:
  """Gather basic GPU stats using torch/pynvml when available."""
  metrics: Dict[str, Any] = {}

  try:
    import torch

    if not torch.cuda.is_available():
      return metrics

    device_index = torch.cuda.current_device()
    props = torch.cuda.get_device_properties(device_index)
    metrics["device"] = props.name
    metrics["memory_total_mb"] = int(props.total_memory / (1024 ** 2))
    metrics["memory_allocated_mb"] = int(torch.cuda.memory_allocated(device_index) / (1024 ** 2))
    metrics["memory_reserved_mb"] = int(torch.cuda.memory_reserved(device_index) / (1024 ** 2))

    temperature = _read_temperature(device_index)
    if temperature is not None:
      metrics["temperature_c"] = temperature
  except Exception as exc:  # pragma: no cover - best effort
    logger.debug("Unable to gather GPU metrics: %s", exc)

  return metrics


def _read_temperature(device_index: int) -> Optional[float]:
  try:
    import pynvml

    pynvml.nvmlInit()
    handle = pynvml.nvmlDeviceGetHandleByIndex(device_index)
    temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
    pynvml.nvmlShutdown()
    return float(temp)
  except Exception:  # pragma: no cover - optional dependency
    return None

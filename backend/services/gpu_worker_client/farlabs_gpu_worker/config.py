from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional

import json
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError, model_validator

DEFAULT_MODEL_MAP = {
  "llama-70b": "meta-llama/Llama-2-70b-chat-hf",
  "mixtral-8x22b": "mistralai/Mixtral-8x22B-Instruct-v0.1",
  "llama-405b": "meta-llama/Llama-3-70B-Instruct",
}


class WorkerSettings(BaseModel):
  """Configuration for a GPU worker instance."""

  model_config = {
    "protected_namespaces": (),
  }

  api_base_url: str = Field(default="http://127.0.0.1:8000")
  api_token: str = Field(..., min_length=8)
  redis_url: str = Field(default="redis://localhost:6379")
  wallet_address: str = Field(..., min_length=10)

  node_id: Optional[str] = Field(default=None)
  gpu_model: Optional[str] = None
  vram_gb: Optional[int] = Field(default=None, ge=1)
  bandwidth_gbps: float = Field(default=1.0, ge=0)
  location: Optional[str] = Field(default="Unknown")
  notes: Optional[str] = None

  heartbeat_interval: float = Field(default=30.0, gt=0)
  queue_name: str = Field(default="inference_queue")
  queue_backoff_seconds: float = Field(default=1.5, gt=0)
  poll_timeout_seconds: int = Field(default=5, ge=1)

  executor: str = Field(default="mock")
  executor_device: str = Field(default="auto")
  executor_dtype: Optional[str] = Field(default=None)
  executor_model_map: Dict[str, str] = Field(default_factory=dict)
  model_cache_dir: Optional[str] = None
  trust_remote_code: bool = Field(default=False)
  api_timeout_seconds: float = Field(default=15.0, gt=0)
  api_verify_tls: bool = Field(default=True)
  api_ca_bundle: Optional[str] = None
  auth_refresh_enabled: bool = Field(default=False)
  auth_refresh_endpoint: str = Field(default="/api/auth/login")
  auth_refresh_leeway_seconds: int = Field(default=60, ge=0)
  auth_wallet_address: Optional[str] = None

  @model_validator(mode="after")
  def _strip_base_url(self) -> "WorkerSettings":
    self.api_base_url = self.api_base_url.rstrip("/")
    return self

  @property
  def requires_registration(self) -> bool:
    return self.node_id is None

  def ensure_registration_requirements(self) -> "WorkerSettings":
    if self.requires_registration:
      missing = []
      if not self.gpu_model:
        missing.append("FARLABS_GPU_MODEL")
      if self.vram_gb is None:
        missing.append("FARLABS_VRAM_GB")
      if missing:
        raise ValueError(
          "GPU registration requires the following env vars: "
          + ", ".join(missing)
        )
    self.wallet_address = self.wallet_address.lower()
    if self.auth_wallet_address:
      self.auth_wallet_address = self.auth_wallet_address.lower()
    else:
      self.auth_wallet_address = self.wallet_address
    if not self.executor_model_map:
      self.executor_model_map = DEFAULT_MODEL_MAP.copy()
    else:
      # Merge defaults without overriding explicit entries
      merged = DEFAULT_MODEL_MAP.copy()
      merged.update(self.executor_model_map)
      self.executor_model_map = merged
    return self

  @classmethod
  def from_env(cls, *, dotenv: bool = True) -> "WorkerSettings":
    if dotenv:
      dotenv_path = os.environ.get("FARLABS_DOTENV_FILE", ".env")
      if Path(dotenv_path).exists():
        load_dotenv(dotenv_path)

    raw = {
      "api_base_url": os.environ.get("FARLABS_API_BASE_URL"),
      "api_token": os.environ.get("FARLABS_API_TOKEN"),
      "redis_url": os.environ.get("FARLABS_REDIS_URL"),
      "wallet_address": os.environ.get("FARLABS_WALLET_ADDRESS"),
      "node_id": os.environ.get("FARLABS_NODE_ID"),
      "gpu_model": os.environ.get("FARLABS_GPU_MODEL"),
      "vram_gb": os.environ.get("FARLABS_VRAM_GB"),
      "bandwidth_gbps": os.environ.get("FARLABS_BANDWIDTH_GBPS"),
      "location": os.environ.get("FARLABS_LOCATION"),
      "notes": os.environ.get("FARLABS_NOTES"),
      "heartbeat_interval": os.environ.get("FARLABS_HEARTBEAT_INTERVAL"),
      "queue_name": os.environ.get("FARLABS_QUEUE_NAME"),
      "queue_backoff_seconds": os.environ.get("FARLABS_QUEUE_BACKOFF_SECONDS"),
      "poll_timeout_seconds": os.environ.get("FARLABS_POLL_TIMEOUT_SECONDS"),
      "executor": os.environ.get("FARLABS_EXECUTOR"),
      "executor_device": os.environ.get("FARLABS_EXECUTOR_DEVICE"),
      "executor_dtype": os.environ.get("FARLABS_EXECUTOR_DTYPE"),
      "model_cache_dir": os.environ.get("FARLABS_MODEL_CACHE_DIR"),
      "trust_remote_code": os.environ.get("FARLABS_TRUST_REMOTE_CODE"),
      "api_timeout_seconds": os.environ.get("FARLABS_API_TIMEOUT_SECONDS"),
      "api_verify_tls": os.environ.get("FARLABS_API_VERIFY_TLS"),
      "api_ca_bundle": os.environ.get("FARLABS_API_CA_BUNDLE"),
      "auth_refresh_enabled": os.environ.get("FARLABS_AUTH_REFRESH_ENABLED"),
      "auth_refresh_endpoint": os.environ.get("FARLABS_AUTH_REFRESH_ENDPOINT"),
      "auth_refresh_leeway_seconds": os.environ.get("FARLABS_AUTH_REFRESH_LEEWAY_SECONDS"),
      "auth_wallet_address": os.environ.get("FARLABS_AUTH_WALLET_ADDRESS"),
    }

    model_map_raw = os.environ.get("FARLABS_EXECUTOR_MODEL_MAP")
    if model_map_raw:
      try:
        raw["executor_model_map"] = json.loads(model_map_raw)
      except json.JSONDecodeError as exc:
        raise ValueError("FARLABS_EXECUTOR_MODEL_MAP must be valid JSON") from exc

    try:
      settings = cls(**{k: v for k, v in raw.items() if v is not None})
    except ValidationError as exc:
      raise ValueError(f"Invalid worker configuration: {exc}") from exc

    return settings.ensure_registration_requirements()


@dataclass
class RegistrationPayload:
  wallet_address: str
  gpu_model: str
  vram_gb: int
  bandwidth_gbps: float
  location: Optional[str]
  notes: Optional[str]

  @classmethod
  def from_settings(cls, settings: WorkerSettings) -> "RegistrationPayload":
    return cls(
      wallet_address=settings.wallet_address.lower(),
      gpu_model=settings.gpu_model or "",
      vram_gb=settings.vram_gb or 0,
      bandwidth_gbps=settings.bandwidth_gbps,
      location=settings.location,
      notes=settings.notes,
    )

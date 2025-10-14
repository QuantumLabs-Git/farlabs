from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class TokenManager:
  """Handles API token storage and refresh for the GPU worker."""

  def __init__(
    self,
    *,
    base_url: str,
    initial_token: Optional[str],
    wallet_address: str,
    refresh_enabled: bool,
    refresh_endpoint: str,
    leeway_seconds: int,
    timeout: float,
    verify_tls: bool,
    ca_bundle: Optional[str],
  ) -> None:
    self._base_url = base_url.rstrip("/")
    self._token: Optional[str] = initial_token
    self._wallet_address = wallet_address
    self._refresh_enabled = refresh_enabled
    self._refresh_endpoint = refresh_endpoint
    self._leeway = max(leeway_seconds, 0)
    self._timeout = timeout
    self._verify_tls = verify_tls
    self._ca_bundle = ca_bundle
    self._expiry: Optional[datetime] = None
    self._lock = asyncio.Lock()

  async def initialize(self) -> None:
    if self._refresh_enabled:
      await self.refresh(force=True)

  async def get_token(self) -> str:
    async with self._lock:
      if self._token and not self._needs_refresh():
        return self._token
    await self.refresh()
    async with self._lock:
      if not self._token:
        raise RuntimeError("Unable to obtain API token")
      return self._token

  async def refresh(self, *, force: bool = False) -> None:
    if not self._refresh_enabled and not force:
      return

    async with self._lock:
      if not force and not self._needs_refresh():
        return

      if not self._refresh_enabled:
        return

      url = f"{self._base_url}{self._refresh_endpoint}"
      verify_param = self._ca_bundle if self._ca_bundle else self._verify_tls
      try:
        async with httpx.AsyncClient(
          timeout=self._timeout,
          verify=verify_param,
        ) as client:
          response = await client.post(url, json={"wallet_address": self._wallet_address})
          response.raise_for_status()
      except httpx.HTTPError as exc:  # pragma: no cover - network path
        logger.error("Failed to refresh API token: %s", exc)
        return

      data = response.json()
      token = data.get("token")
      if not token:
        logger.error("Token refresh response missing token field")
        return

      expires_in = data.get("expires_in")
      expiry = None
      if isinstance(expires_in, (int, float)):
        expiry = datetime.now(timezone.utc) + timedelta(seconds=float(expires_in))

      self._token = token
      self._expiry = expiry
      logger.info("Obtained fresh API token valid until %s", expiry)

  def _needs_refresh(self) -> bool:
    if not self._refresh_enabled:
      return False
    if not self._token:
      return True
    if not self._expiry:
      return True
    now = datetime.now(timezone.utc)
    return now >= (self._expiry - timedelta(seconds=self._leeway))

  @property
  def refresh_enabled(self) -> bool:
    return self._refresh_enabled

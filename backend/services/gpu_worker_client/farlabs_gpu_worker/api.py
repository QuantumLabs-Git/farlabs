from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)


class PlatformApiClient:
  """HTTP client for Far Labs control plane APIs."""

  def __init__(
    self,
    base_url: str,
    token_manager,
    *,
    timeout: float = 15.0,
    verify_tls: bool = True,
    ca_bundle: Optional[str] = None,
  ) -> None:
    self._base_url = base_url.rstrip("/")
    self._timeout = timeout
    self._verify_tls = verify_tls
    self._ca_bundle = ca_bundle
    self._client: Optional[httpx.AsyncClient] = None
    self._token_manager = token_manager

  async def __aenter__(self) -> "PlatformApiClient":
    await self._token_manager.initialize()
    self._client = httpx.AsyncClient(
      base_url=self._base_url,
      timeout=self._timeout,
      verify=self._ca_bundle or self._verify_tls,
      headers={
        "Content-Type": "application/json",
      },
    )
    return self

  async def __aexit__(self, exc_type, exc, tb) -> None:  # type: ignore[override]
    if self._client:
      await self._client.aclose()
      self._client = None

  async def register_node(self, payload: Dict[str, Any]) -> Dict[str, Any]:
    response = await self._request("POST", "/api/gpu/nodes", json=payload)
    data = response.json()
    logger.info("Registered GPU node %s", data.get("node_id"))
    return data

  async def send_heartbeat(self, node_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    response = await self._request(
      "POST", f"/api/gpu/nodes/{node_id}/heartbeat", json=payload
    )
    return response.json()

  async def get_node(self, node_id: str) -> Dict[str, Any]:
    response = await self._request("GET", f"/api/gpu/nodes/{node_id}")
    return response.json()

  async def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
    if not self._client:
      raise RuntimeError("PlatformApiClient not initialised (use 'async with').")
    token = await self._token_manager.get_token()
    headers = kwargs.pop("headers", {})
    headers.setdefault("Authorization", f"Bearer {token}")
    try:
      response = await self._client.request(method, path, headers=headers, **kwargs)
      response.raise_for_status()
      return response
    except httpx.HTTPStatusError as exc:
      if exc.response.status_code == 401 and self._token_manager.refresh_enabled:
        await self._token_manager.refresh(force=True)
        token = await self._token_manager.get_token()
        headers["Authorization"] = f"Bearer {token}"
        response = await self._client.request(method, path, headers=headers, **kwargs)
        response.raise_for_status()
        return response
      body = exc.response.text
      logger.error("API %s %s failed: %s", method, path, body)
      raise
    except httpx.HTTPError as exc:
      logger.error("API %s %s error: %s", method, path, exc)
      raise

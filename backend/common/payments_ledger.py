"""Redis-backed payments ledger utilities shared across services."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List

BALANCE_HASH = "payments:balance"
ESCROW_HASH = "payments:escrow"
HISTORY_PREFIX = "payments:history:"
MAX_HISTORY_ENTRIES = 100


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _append_history(
    client: Any,
    wallet: str,
    *,
    event_type: str,
    direction: str,
    amount: float,
    reference: Optional[str] = None,
    status: str = "confirmed",
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    record = {
        "id": uuid.uuid4().hex,
        "type": event_type,
        "direction": direction,
        "amount": amount,
        "asset": "FAR",
        "reference": reference,
        "status": status,
        "timestamp": _now_iso(),
    }
    if metadata:
        record["metadata"] = metadata
    history_key = f"{HISTORY_PREFIX}{wallet.lower()}"
    await client.lpush(history_key, json.dumps(record))
    await client.ltrim(history_key, 0, MAX_HISTORY_ENTRIES - 1)


async def get_balances(client: Any, wallet: str) -> Dict[str, float]:
    wallet = wallet.lower()
    available_raw = await client.hget(BALANCE_HASH, wallet)
    escrow_raw = await client.hget(ESCROW_HASH, wallet)
    available = float(available_raw or 0.0)
    escrowed = float(escrow_raw or 0.0)
    return {"available": available, "escrowed": escrowed, "total": available + escrowed}


async def get_history(client: Any, wallet: str, limit: int = 50) -> List[Dict[str, Any]]:
    wallet = wallet.lower()
    raw_entries = await client.lrange(f"{HISTORY_PREFIX}{wallet}", 0, limit - 1)
    entries: List[Dict[str, Any]] = []
    for raw in raw_entries:
        try:
            entries.append(json.loads(raw))
        except (TypeError, json.JSONDecodeError):
            continue
    return entries


async def add_available(
    client: Any,
    wallet: str,
    amount: float,
    *,
    event_type: str,
    reference: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, float]:
    if amount < 0:
        raise ValueError("Amount must be non-negative")
    wallet = wallet.lower()
    await client.hincrbyfloat(BALANCE_HASH, wallet, amount)
    await _append_history(
        client,
        wallet,
        event_type=event_type,
        direction="credit",
        amount=amount,
        reference=reference,
        metadata=metadata,
    )
    return await get_balances(client, wallet)


async def remove_available(
    client: Any,
    wallet: str,
    amount: float,
    *,
    event_type: str,
    reference: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, float]:
    if amount < 0:
        raise ValueError("Amount must be non-negative")
    wallet = wallet.lower()
    balances = await get_balances(client, wallet)
    if balances["available"] < amount:
        raise ValueError("Insufficient available balance")
    await client.hincrbyfloat(BALANCE_HASH, wallet, -amount)
    await _append_history(
        client,
        wallet,
        event_type=event_type,
        direction="debit",
        amount=amount,
        reference=reference,
        metadata=metadata,
    )
    return await get_balances(client, wallet)


async def move_to_escrow(
    client: Any,
    wallet: str,
    amount: float,
    *,
    event_type: str,
    reference: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, float]:
    if amount < 0:
        raise ValueError("Amount must be non-negative")
    wallet = wallet.lower()
    await remove_available(
        client,
        wallet,
        amount,
        event_type=event_type,
        reference=reference,
        metadata=metadata,
    )
    await client.hincrbyfloat(ESCROW_HASH, wallet, amount)
    await _append_history(
        client,
        wallet,
        event_type=f"{event_type}_escrow",
        direction="credit",
        amount=amount,
        reference=reference,
        metadata=metadata,
    )
    return await get_balances(client, wallet)


async def consume_escrow(
    client: Any,
    wallet: str,
    amount: float,
    *,
    event_type: str,
    reference: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, float]:
    if amount < 0:
        raise ValueError("Amount must be non-negative")
    wallet = wallet.lower()
    escrow_raw = await client.hget(ESCROW_HASH, wallet)
    escrow_balance = float(escrow_raw or 0.0)
    if escrow_balance < amount:
        raise ValueError("Insufficient escrow balance")
    await client.hincrbyfloat(ESCROW_HASH, wallet, -amount)
    await _append_history(
        client,
        wallet,
        event_type=event_type,
        direction="debit",
        amount=amount,
        reference=reference,
        metadata=metadata,
    )
    return await get_balances(client, wallet)


async def refund_from_escrow(
    client: Any,
    wallet: str,
    amount: float,
    *,
    event_type: str,
    reference: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, float]:
    if amount < 0:
        raise ValueError("Amount must be non-negative")
    wallet = wallet.lower()
    escrow_raw = await client.hget(ESCROW_HASH, wallet)
    escrow_balance = float(escrow_raw or 0.0)
    if escrow_balance < amount:
        raise ValueError("Insufficient escrow balance")
    await client.hincrbyfloat(ESCROW_HASH, wallet, -amount)
    await client.hincrbyfloat(BALANCE_HASH, wallet, amount)
    await _append_history(
        client,
        wallet,
        event_type=event_type,
        direction="credit",
        amount=amount,
        reference=reference,
        metadata=metadata,
    )
    return await get_balances(client, wallet)

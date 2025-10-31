from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

import redis.asyncio as redis  # type: ignore[import-untyped]
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

POSITIONS_KEY = "staking:positions"
HISTORY_PREFIX = "staking:history:"
MAX_HISTORY = 100


app = FastAPI(title="Far Labs Staking Service")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://app.farlabs.ai").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class StakeRequest(BaseModel):
    wallet_address: str = Field(..., min_length=10, max_length=64)
    amount: float = Field(..., gt=0)
    lock_period_days: int = Field(..., ge=1, le=1460)


class WithdrawRequest(BaseModel):
    wallet_address: str = Field(..., min_length=10, max_length=64)
    amount: float = Field(..., gt=0)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _append_history(wallet: str, event: Dict[str, Any]) -> None:
    key = f"{HISTORY_PREFIX}{wallet.lower()}"
    record = {
        "id": uuid.uuid4().hex,
        "timestamp": _now_iso(),
        **event,
    }
    await redis_client.lpush(key, json.dumps(record))
    await redis_client.ltrim(key, 0, MAX_HISTORY - 1)


async def _get_position(wallet: str) -> Dict[str, Any]:
    payload = await redis_client.hget(POSITIONS_KEY, wallet.lower())
    if not payload:
        return {"wallet_address": wallet.lower(), "amount": 0.0, "lock_period_days": 0, "rewards_earned": 0.0}
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        data = {}
    return {
        "wallet_address": wallet.lower(),
        "amount": data.get("amount", 0.0),
        "lock_period_days": data.get("lock_period_days", 0),
        "rewards_earned": data.get("rewards_earned", 0.0),
        "last_updated": data.get("last_updated"),
        "since": data.get("since")
    }


async def _set_position(wallet: str, position: Dict[str, Any]) -> None:
    await redis_client.hset(POSITIONS_KEY, wallet.lower(), json.dumps(position))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "staking"}


@app.post("/api/staking/deposit")
async def deposit(request: StakeRequest) -> Dict[str, Any]:
    wallet = request.wallet_address.lower()
    position = await _get_position(wallet)
    new_amount = position["amount"] + request.amount
    position.update(
        {
            "amount": new_amount,
            "lock_period_days": max(position.get("lock_period_days", 0), request.lock_period_days),
            "last_updated": _now_iso(),
        }
    )
    if not position.get("since"):
        position["since"] = _now_iso()
    await _set_position(wallet, position)
    await _append_history(wallet, {
        "type": "deposit",
        "amount": request.amount,
        "lock_period_days": request.lock_period_days,
        "status": "confirmed",
    })
    return position


@app.post("/api/staking/withdraw")
async def withdraw(request: WithdrawRequest) -> Dict[str, Any]:
    wallet = request.wallet_address.lower()
    position = await _get_position(wallet)
    if position["amount"] < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient staked balance")
    position["amount"] -= request.amount
    position["last_updated"] = _now_iso()
    await _set_position(wallet, position)
    await _append_history(wallet, {
        "type": "withdraw",
        "amount": request.amount,
        "status": "confirmed",
    })
    return position


@app.get("/api/staking/position/{wallet_address}")
async def position(wallet_address: str) -> Dict[str, Any]:
    return await _get_position(wallet_address)


@app.get("/api/staking/history/{wallet_address}")
async def history(wallet_address: str, limit: int = 50) -> Dict[str, Any]:
    raw = await redis_client.lrange(f"{HISTORY_PREFIX}{wallet_address.lower()}", 0, limit - 1)
    entries: List[Dict[str, Any]] = []
    for item in raw:
        try:
            entries.append(json.loads(item))
        except (TypeError, json.JSONDecodeError):
            continue
    return {"history": entries}


@app.get("/api/staking/balance")
async def balance() -> Dict[str, Any]:
    """Get staking balance for the authenticated user (from X-User-Address header)"""
    # This is typically set by the API gateway after JWT validation
    # For now, return a default response
    # The API gateway should pass the wallet address via header
    return {
        "staked": 0.0,
        "rewards": 0.0,
        "apy": 0.185,
        "lock_days": 0,
        "status": "active"
    }


@app.get("/api/staking/status")
async def status() -> Dict[str, Any]:
    """Get staking status for the authenticated user"""
    return {
        "staked": 0.0,
        "rewards_pending": 0.0,
        "rewards_claimed": 0.0,
        "apy": 0.185,
        "next_reward_date": _now_iso(),
        "status": "active"
    }


@app.get("/api/staking/metrics")
async def staking_metrics():
    raw_positions = await redis_client.hgetall(POSITIONS_KEY)
    total_amount = 0.0
    weighted_lock = 0.0
    participant_count = 0

    for payload in raw_positions.values():
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            continue
        amount = float(data.get("amount", 0.0))
        lock_days = int(data.get("lock_period_days", 0))
        if amount <= 0:
            continue
        participant_count += 1
        total_amount += amount
        weighted_lock += amount * lock_days

    average_lock = (weighted_lock / total_amount) if total_amount else 0

    return {
        "tvl_far": total_amount,
        "apy": 0.185,
        "participants": participant_count,
        "average_lock_days": round(average_lock, 2),
        "distribution": {
            "inference": 0.34,
            "gpu": 0.28,
            "gaming": 0.16,
            "desci": 0.09,
            "gamed": 0.08,
            "fartwin": 0.05,
        },
    }

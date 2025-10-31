from __future__ import annotations

import os
from typing import Any, Dict, Optional

import redis.asyncio as redis  # type: ignore[import-untyped]
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pathlib import Path
import sys

# Add parent directory to path for local development
# In Docker, the common module is installed via pip, so this is not needed
try:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
except IndexError:
    # Running in Docker where directory structure is flat
    pass

from common import payments_ledger  # noqa: E402

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

app = FastAPI(title="Far Labs Payments Service", version="1.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://app.farlabs.ai").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class WalletRequest(BaseModel):
    wallet_address: str = Field(..., min_length=10, max_length=64)


class WalletAmountRequest(WalletRequest):
    amount: float = Field(..., gt=0)
    reference: Optional[str] = Field(default=None, max_length=120)
    metadata: Optional[Dict[str, Any]] = None


class EscrowRequest(WalletAmountRequest):
    pass


class PayoutRequest(BaseModel):
    recipient_wallet: str = Field(..., min_length=10, max_length=64)
    amount: float = Field(..., gt=0)
    source_wallet: Optional[str] = Field(default=None, max_length=64)
    reference: Optional[str] = Field(default=None, max_length=120)
    metadata: Optional[Dict[str, Any]] = None


class ChargeRequest(WalletAmountRequest):
    pass


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok", "service": "payments"}


@app.get("/healthz")
async def healthcheck() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/payments/balance")
async def get_current_user_balance() -> Dict[str, float]:
    """Get balance for the authenticated user (from X-User-Address header)"""
    # This is typically set by the API gateway after JWT validation
    # For testing, return zero balances
    return {
        "available": 0.0,
        "escrow": 0.0,
        "total": 0.0
    }


@app.get("/api/payments/balances/{wallet_address}")
async def get_balance(wallet_address: str) -> Dict[str, float]:
    return await payments_ledger.get_balances(redis_client, wallet_address)


@app.get("/api/payments/history/{wallet_address}")
async def get_history(wallet_address: str, limit: int = 50) -> Dict[str, Any]:
    history = await payments_ledger.get_history(redis_client, wallet_address, limit=limit)
    return {"history": history}


@app.post("/api/payments/topup")
async def topup(payload: WalletAmountRequest) -> Dict[str, float]:
    return await payments_ledger.add_available(
        redis_client,
        payload.wallet_address,
        payload.amount,
        event_type="topup",
        reference=payload.reference,
        metadata=payload.metadata,
    )


@app.post("/api/payments/withdraw")
async def withdraw(payload: WalletAmountRequest) -> Dict[str, float]:
    try:
        return await payments_ledger.remove_available(
            redis_client,
            payload.wallet_address,
            payload.amount,
            event_type="withdraw",
            reference=payload.reference,
            metadata=payload.metadata,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/payments/lock")
async def lock_funds(payload: EscrowRequest) -> Dict[str, float]:
    try:
        return await payments_ledger.move_to_escrow(
            redis_client,
            payload.wallet_address,
            payload.amount,
            event_type="lock",
            reference=payload.reference,
            metadata=payload.metadata,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/payments/release")
async def release_funds(payload: EscrowRequest) -> Dict[str, float]:
    try:
        return await payments_ledger.refund_from_escrow(
            redis_client,
            payload.wallet_address,
            payload.amount,
            event_type="release",
            reference=payload.reference,
            metadata=payload.metadata,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/payments/payout")
async def payout(payload: PayoutRequest) -> Dict[str, float]:
    metadata = payload.metadata or {}
    if payload.source_wallet:
        metadata = {**metadata, "source_wallet": payload.source_wallet}
    return await payments_ledger.add_available(
        redis_client,
        payload.recipient_wallet,
        payload.amount,
        event_type="payout",
        reference=payload.reference,
        metadata=metadata,
    )


@app.post("/api/payments/charge")
async def charge(payload: ChargeRequest) -> Dict[str, float]:
    try:
        return await payments_ledger.consume_escrow(
            redis_client,
            payload.wallet_address,
            payload.amount,
            event_type="charge",
            reference=payload.reference,
            metadata=payload.metadata,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

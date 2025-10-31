from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
from typing import Any, Dict
import httpx

import jwt
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable must be set")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "120"))

# Free token configuration for testing
ENABLE_FREE_TOKENS = os.getenv("ENABLE_FREE_TOKENS", "true").lower() in {"1", "true", "yes"}
FREE_TOKENS_ON_LOGIN = float(os.getenv("FREE_TOKENS_ON_LOGIN", "100.0"))
PAYMENTS_SERVICE_URL = os.getenv("PAYMENTS_SERVICE_URL", "http://farlabs-payments-free:8000")

security = HTTPBearer()

app = FastAPI(title="Far Labs Auth Service", version="1.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://app.farlabs.ai").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    wallet_address: str = Field(..., min_length=10, max_length=64)
    session_tag: str | None = Field(default=None, max_length=64)


class TokenResponse(BaseModel):
    token: str
    wallet_address: str
    expires_in: int
    session_tag: str | None = None


def _issue_token(wallet_address: str, session_tag: str | None = None) -> TokenResponse:
    wallet_normalized = wallet_address.lower()
    exp = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRES_MINUTES)
    payload: Dict[str, Any] = {
        "sub": wallet_normalized,
        "iat": datetime.now(timezone.utc).timestamp(),
        "exp": exp.timestamp(),
    }
    if session_tag:
        payload["tag"] = session_tag
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return TokenResponse(
        token=token,
        wallet_address=wallet_normalized,
        expires_in=JWT_EXPIRES_MINUTES * 60,
        session_tag=session_tag,
    )


def _decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


async def _give_free_tokens(wallet_address: str) -> None:
    """Give free tokens to new users on login (for testing)"""
    if not ENABLE_FREE_TOKENS:
        return

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Check current balance
            try:
                balance_resp = await client.get(
                    f"{PAYMENTS_SERVICE_URL}/api/payments/balances/{wallet_address}"
                )
                if balance_resp.status_code == 200:
                    balance_data = balance_resp.json()
                    # Only give tokens if balance is very low (< 1 token)
                    if balance_data.get("total", 0) >= 1.0:
                        return
            except Exception:
                # If we can't check balance, proceed to give tokens
                pass

            # Give free tokens
            await client.post(
                f"{PAYMENTS_SERVICE_URL}/api/payments/topup",
                json={
                    "wallet_address": wallet_address,
                    "amount": FREE_TOKENS_ON_LOGIN,
                    "reference": "free_tokens_on_login",
                    "metadata": {"source": "auth_service", "reason": "welcome_bonus"}
                }
            )
    except Exception:
        # Silently fail - don't block login if payments service is down
        pass


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    # Give free tokens to user if enabled
    await _give_free_tokens(payload.wallet_address)
    return _issue_token(payload.wallet_address, payload.session_tag)


@app.get("/api/auth/me")
async def me(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    payload = _decode_token(credentials.credentials)
    return {"wallet_address": payload.get("sub"), "session_tag": payload.get("tag")}


@app.get("/healthz")
async def healthcheck() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/logout")
async def logout(request: Request) -> Dict[str, str]:
    # Stateless JWT – client deletes token.
    return {"status": "ok"}

"""API Gateway for Far Labs

This FastAPI application proxies requests to internal microservices, handles authentication,
rate limiting stubs, and unifies API responses for the frontend.
"""

from __future__ import annotations

import os
import jwt
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx

SERVICE_ROUTES = {
    "inference": "http://inference-service.internal:8000",
    "gaming": "http://gaming-service.internal:8000",
    "desci": "http://desci-service.internal:8000",
    "gamed": "http://gamed-service.internal:8000",
    "gpu": "http://gpu-service.internal:8000",
    "staking": "http://staking-service.internal:8000",
    "payments": "http://payments-service.internal:8000",
    "auth": "http://auth-service.internal:8000",
}

app = FastAPI(title="Far Labs API Gateway", version="1.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://app.farlabs.ai").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable must be set")
JWT_ALGORITHM = "HS256"


async def authenticate(request: Request) -> None:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = auth_header.split()[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    request.state.user = payload


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/revenue/summary", dependencies=[Depends(authenticate)])
async def revenue_summary():
    # Synthesised response for documentation purposes
    return {
        "totalUsd": 182_000_000,
        "totalFar": 521_000_000,
        "streams": [
            {"id": "inference", "name": "Far Inference", "percentage": 34, "monthlyReturn": 12.1},
            {"id": "gpu", "name": "Far GPU De-Pin", "percentage": 28, "monthlyReturn": 10.4},
            {"id": "gaming", "name": "Farcana Game", "percentage": 16, "monthlyReturn": 6.2},
        ],
    }


@app.api_route("/proxy/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy(service: str, path: str, request: Request):
    return await proxy_request(service, f"/{path}", request)


async def proxy_request(service: str, target_path: str, request: Request):
    base_url = SERVICE_ROUTES.get(service)
    if not base_url:
        raise HTTPException(status_code=404, detail="Unknown service")

    headers = {key: value for key, value in request.headers.items() if key.lower() != "host"}
    user_payload = getattr(request.state, "user", {})
    if isinstance(user_payload, dict) and "sub" in user_payload:
        headers["x-user-address"] = user_payload["sub"]

    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        response = await client.request(
            method=request.method,
            url=target_path,
            headers=headers,
            params=dict(request.query_params),
            content=(await request.body()) if request.method not in {"GET", "HEAD"} else None,
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    try:
        return response.json()
    except ValueError:
        return {"message": response.text}


@app.api_route("/api/inference/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], dependencies=[Depends(authenticate)])
async def inference_proxy(path: str, request: Request):
    target_path = f"/api/inference/{path}" if path else "/api/inference"
    return await proxy_request("inference", target_path, request)


@app.api_route("/api/gpu/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], dependencies=[Depends(authenticate)])
async def gpu_proxy(path: str, request: Request):
    target_path = f"/api/gpu/{path}" if path else "/api/gpu"
    return await proxy_request("gpu", target_path, request)


@app.get("/api/network/status", dependencies=[Depends(authenticate)])
async def network_status(request: Request):
    return await proxy_request("inference", "/api/network/status", request)


@app.api_route("/api/payments/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], dependencies=[Depends(authenticate)])
async def payments_proxy(path: str, request: Request):
    target_path = f"/api/payments/{path}" if path else "/api/payments"
    return await proxy_request("payments", target_path, request)


@app.api_route("/api/staking/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], dependencies=[Depends(authenticate)])
async def staking_proxy(path: str, request: Request):
    target_path = f"/api/staking/{path}" if path else "/api/staking"
    return await proxy_request("staking", target_path, request)


@app.post("/api/auth/login")
async def auth_login(request: Request):
    return await proxy_request("auth", "/api/auth/login", request)


@app.get("/api/auth/me", dependencies=[Depends(authenticate)])
async def auth_me(request: Request):
    return await proxy_request("auth", "/api/auth/me", request)

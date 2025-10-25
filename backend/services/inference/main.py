"""Far Labs Inference Service

This FastAPI application coordinates inference tasks across the Far GPU De-Pin network.
It follows the specification provided in the Far Labs technical design and includes:

- JWT verification placeholder (replace with production auth implementation)
- Payment verification hooks via the InferencePayment smart contract
- Redis-backed task queue with pub/sub for streaming results
- GPU node registration and scoring logic
"""

from __future__ import annotations

import asyncio
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pathlib import Path
import sys

import redis.asyncio as redis  # type: ignore[import-untyped]
from redis.asyncio import Redis  # type: ignore[import-untyped]
from fastapi import Depends, FastAPI, HTTPException, WebSocket
import jwt
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from web3 import Web3  # type: ignore[import-untyped]

try:
    import torch  # type: ignore  # noqa: F401
    from transformers import AutoModelForCausalLM, AutoTokenizer  # type: ignore
except Exception:  # pragma: no cover - optional dependency for local dev
    AutoModelForCausalLM = None
    AutoTokenizer = None

try:
    from common import payments_ledger  # noqa: E402
except ImportError:
    # If common module is not available, create a mock version
    class MockPaymentsLedger:
        async def get_balances(self, *args, **kwargs):
            return {"available": float('inf'), "escrow": 0}
        async def move_to_escrow(self, *args, **kwargs):
            pass
        async def refund_from_escrow(self, *args, **kwargs):
            pass
        async def consume_escrow(self, *args, **kwargs):
            pass
        async def add_available(self, *args, **kwargs):
            pass

    class MockModule:
        payments_ledger = MockPaymentsLedger()

    payments_ledger = MockModule().payments_ledger

app = FastAPI(title="Far Labs Inference Service", version="1.0.0")
security = HTTPBearer()

BSC_RPC = os.getenv("BSC_RPC_URL", "https://bsc-dataseed.binance.org/")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CONTRACT_ADDRESS = os.getenv("INFERENCE_PAYMENT_CONTRACT", "0x00000000000000000000000000000000fA001234")
SKIP_PAYMENT_VALIDATION = os.getenv("SKIP_PAYMENT_VALIDATION", "true").lower() in {"1", "true", "yes"}
TREASURY_WALLET = os.getenv("TREASURY_WALLET", "treasury")
STAKER_POOL_WALLET = os.getenv("STAKER_POOL_WALLET", "staker_pool")
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable must be set")
JWT_ALGORITHM = "HS256"

w3 = Web3(Web3.HTTPProvider(BSC_RPC))
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

GPU_NODE_REGISTRY_KEY = "gpu:nodes"
TASK_STORE_KEY = "inference:tasks"
USER_TASK_INDEX_PREFIX = "inference:user:"
GPU_OWNER_INDEX_PREFIX = "gpu:owner:"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def get_gpu_nodes() -> Dict[str, Dict[str, Any]]:
    records = await redis_client.hgetall(GPU_NODE_REGISTRY_KEY)
    nodes: Dict[str, Dict[str, Any]] = {}
    for node_id, payload in records.items():
        try:
            nodes[node_id] = json.loads(payload)
        except (TypeError, json.JSONDecodeError):
            continue
    return nodes


async def get_gpu_node(node_id: str) -> Dict[str, Any]:
    payload = await redis_client.hget(GPU_NODE_REGISTRY_KEY, node_id)
    if not payload:
        raise HTTPException(status_code=404, detail="GPU node not found")
    return json.loads(payload)


async def persist_gpu_node(node_id: str, record: Dict[str, Any]) -> None:
    stored = {k: v for k, v in record.items() if k != "node_id"}
    await redis_client.hset(GPU_NODE_REGISTRY_KEY, node_id, json.dumps(stored))
    owner_key = f"{GPU_OWNER_INDEX_PREFIX}{stored['wallet_address'].lower()}"
    await redis_client.sadd(owner_key, node_id)


async def mark_node_available(node_id: str, *, success: bool, task_id: Optional[str] = None) -> None:
    try:
        node_record = await get_gpu_node(node_id)
    except HTTPException:
        return
    node_record["status"] = "available"
    node_record["last_heartbeat"] = utc_now_iso()
    if success:
        node_record["last_completed_task"] = task_id
        node_record["tasks_completed"] = int(node_record.get("tasks_completed", 0)) + 1
    await persist_gpu_node(node_id, node_record)


async def select_best_gpu_node(model: ModelInfo) -> Optional[str]:
    nodes = await get_gpu_nodes()
    eligible: List[tuple[str, float]] = []
    for node_id, node in nodes.items():
        status = node.get("status", "available")
        vram = float(node.get("vram_gb") or node.get("capabilities", {}).get("vram", 0))
        score = float(node.get("score", 100.0))
        if status != "available" or vram < model.min_gpu_vram:
            continue
        eligible.append((node_id, score))

    if not eligible:
        return None

    eligible.sort(key=lambda item: item[1], reverse=True)
    return eligible[0][0]


async def update_gpu_node_score(node_id: str, performance: Dict[str, float]) -> float:
    node = await get_gpu_node(node_id)
    current = float(node.get("score", 100.0))
    uptime_factor = performance.get("uptime", 0) / 100
    speed_expected = max(performance.get("expected_speed", 1), 1)
    speed_factor = min(1.0, performance.get("actual_speed", 0) / speed_expected)
    accuracy_factor = performance.get("accuracy", 0.0)

    new_score = (current * 0.7) + (uptime_factor * 10) + (speed_factor * 10) + (accuracy_factor * 10)
    new_score = max(0.0, min(100.0, new_score))
    node["score"] = new_score
    node["last_performance_update"] = utc_now_iso()
    await persist_gpu_node(node_id, node)

    adjustment = (new_score - 80.0) / 200.0
    return adjustment


class TaskStore:
    def __init__(self, client: Redis) -> None:
        self.client = client

    @staticmethod
    def _user_key(user_address: str) -> str:
        return f"{USER_TASK_INDEX_PREFIX}{user_address.lower()}"

    async def create(self, record: Dict[str, Any]) -> None:
        task_id = record["task_id"]
        await self.client.hset(TASK_STORE_KEY, task_id, json.dumps({k: v for k, v in record.items() if k != "task_id"}))
        key = self._user_key(record["user_address"])
        await self.client.lrem(key, 0, task_id)
        await self.client.lpush(key, task_id)

    async def update(self, task_id: str, updates: Dict[str, Any]) -> None:
        existing = await self.get(task_id)
        if not existing:
            return
        merged = {**existing, **updates}
        await self.client.hset(
            TASK_STORE_KEY,
            task_id,
            json.dumps({k: v for k, v in merged.items() if k != "task_id"}),
        )
        key = self._user_key(existing["user_address"])
        await self.client.lrem(key, 0, task_id)
        await self.client.lpush(key, task_id)

    async def get(self, task_id: str) -> Optional[Dict[str, Any]]:
        payload = await self.client.hget(TASK_STORE_KEY, task_id)
        if not payload:
            return None
        data = json.loads(payload)
        data["task_id"] = task_id
        return data

    async def list_for_user(self, user_address: str, limit: int = 50) -> List[Dict[str, Any]]:
        key = self._user_key(user_address)
        task_ids = await self.client.lrange(key, 0, limit - 1)
        tasks: List[Dict[str, Any]] = []
        for task_id in task_ids:
            task = await self.get(task_id)
            if task:
                tasks.append(task)
        return tasks

    async def list_recent(self, limit: int = 100) -> List[Dict[str, Any]]:
        task_ids = await self.client.hkeys(TASK_STORE_KEY)
        tasks: List[Dict[str, Any]] = []
        for task_id in task_ids[:limit]:
            task = await self.get(task_id)
            if task:
                tasks.append(task)
        tasks.sort(key=lambda entry: entry.get("updated_at") or entry.get("created_at") or "", reverse=True)  # type: ignore[call-arg]
        return tasks


task_store = TaskStore(redis_client)


class ModelInfo(BaseModel):
    path: str
    min_gpu_vram: int
    tokens_per_second: int
    price_per_1m_tokens: float


MODEL_REGISTRY: Dict[str, ModelInfo] = {
    "llama-70b": ModelInfo(
        path="meta-llama/Llama-2-70b-chat-hf",
        min_gpu_vram=140,
        tokens_per_second=50,
        price_per_1m_tokens=3.0,
    ),
    "mixtral-8x22b": ModelInfo(
        path="mistralai/Mixtral-8x22B-Instruct-v0.1",
        min_gpu_vram=180,
        tokens_per_second=40,
        price_per_1m_tokens=5.0,
    ),
    "llama-405b": ModelInfo(
        path="meta-llama/Llama-3-405b-instruct",
        min_gpu_vram=810,
        tokens_per_second=30,
        price_per_1m_tokens=15.0,
    ),
}


class PaymentProcessor:
    """Ledger-backed payment processing for inference tasks."""

    def __init__(self, contract_address: str) -> None:
        self.contract_address = Web3.to_checksum_address(contract_address)

    async def verify_payment(self, user_address: str, amount: float) -> bool:
        if SKIP_PAYMENT_VALIDATION:
            return True
        balances = await payments_ledger.get_balances(redis_client, user_address)
        return balances["available"] >= amount

    async def hold(self, user_address: str, amount: float, task_id: str, metadata: Dict[str, Any]) -> None:
        if SKIP_PAYMENT_VALIDATION:
            return
        await payments_ledger.move_to_escrow(
            redis_client,
            user_address,
            amount,
            event_type="inference_hold",
            reference=task_id,
            metadata=metadata,
        )

    async def refund(self, user_address: str, amount: float, task_id: str, metadata: Dict[str, Any]) -> None:
        if SKIP_PAYMENT_VALIDATION:
            return
        await payments_ledger.refund_from_escrow(
            redis_client,
            user_address,
            amount,
            event_type="inference_refund",
            reference=task_id,
            metadata=metadata,
        )

    async def settle(self, user_address: str, estimated: float, actual: float, task_id: str, metadata: Dict[str, Any]) -> None:
        if SKIP_PAYMENT_VALIDATION:
            return
        await payments_ledger.consume_escrow(
            redis_client,
            user_address,
            actual,
            event_type="inference_charge",
            reference=task_id,
            metadata=metadata,
        )
        if estimated > actual:
            difference = estimated - actual
            await payments_ledger.refund_from_escrow(
                redis_client,
                user_address,
                difference,
                event_type="inference_refund",
                reference=task_id,
                metadata=metadata,
            )

    async def distribute_rewards(
        self,
        task_id: str,
        total_amount: float,
        node_id: str,
        performance_adjustment: float,
    ) -> str:
        gpu_payment = total_amount * 0.6 * (1 + performance_adjustment)
        staker_payment = total_amount * 0.2
        treasury_payment = total_amount * 0.2

        try:
            node_record = await get_gpu_node(node_id)
        except HTTPException:
            node_record = {}
        node_wallet = node_record.get("wallet_address") or node_record.get("wallet")

        metadata = {"task_id": task_id, "node_id": node_id}

        if node_wallet:
            await payments_ledger.add_available(
                redis_client,
                node_wallet,
                gpu_payment,
                event_type="gpu_payout",
                reference=task_id,
                metadata=metadata,
            )

        await payments_ledger.add_available(
            redis_client,
            STAKER_POOL_WALLET,
            staker_payment,
            event_type="staking_share",
            reference=task_id,
            metadata=metadata,
        )

        await payments_ledger.add_available(
            redis_client,
            TREASURY_WALLET,
            treasury_payment,
            event_type="treasury_share",
            reference=task_id,
            metadata=metadata,
        )

        return "0xledger"


payment_processor = PaymentProcessor(CONTRACT_ADDRESS)


async def verify_jwt_token(token: str) -> str:
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    user_address = payload.get("sub")
    if not user_address:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_address


async def wait_for_result(task_id: str, timeout: int = 120) -> Optional[Dict[str, Any]]:
    channel = f"task:{task_id}"
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(channel)

    async def listener() -> Optional[Dict[str, Any]]:
        async for message in pubsub.listen():
            if message.get("type") != "message":
                continue
            payload = json.loads(message["data"])
            if payload.get("status") in {"completed", "failed"}:
                return payload
        return None

    try:
        return await asyncio.wait_for(listener(), timeout=timeout)
    except asyncio.TimeoutError:
        return None
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()


class InferenceRequest(BaseModel):
    model_id: str
    prompt: str
    max_tokens: int = 1000
    temperature: float = 0.7


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint for load balancer"""
    return {"status": "healthy"}


@app.post("/api/inference/generate")
async def generate_text(
    payload: InferenceRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    user_address = await verify_jwt_token(credentials.credentials)

    model_info = MODEL_REGISTRY.get(payload.model_id)
    if not model_info:
        raise HTTPException(status_code=404, detail="Model not found")

    estimated_cost = (payload.max_tokens / 1_000_000) * model_info.price_per_1m_tokens

    if not await payment_processor.verify_payment(user_address, estimated_cost):
        raise HTTPException(status_code=402, detail="Insufficient balance")

    node_id = await select_best_gpu_node(model_info)
    if not node_id:
        raise HTTPException(status_code=503, detail="No available GPU nodes")

    task_id = str(uuid.uuid4())
    task_data = {
        "task_id": task_id,
        "user_address": user_address.lower(),
        "model": payload.model_id,
        "prompt": payload.prompt,
        "max_tokens": payload.max_tokens,
        "temperature": payload.temperature,
        "node_id": node_id,
        "status": "queued",
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }

    await task_store.create(task_data)

    metadata = {
        "model": payload.model_id,
        "estimated_cost": estimated_cost,
    }

    await payment_processor.hold(user_address, estimated_cost, task_id, metadata)

    try:
        node_record = await get_gpu_node(node_id)
        node_record["status"] = "busy"
        node_record["last_task_id"] = task_id
        node_record["last_assigned_at"] = utc_now_iso()
        await persist_gpu_node(node_id, node_record)
    except HTTPException:
        # If the node record is missing we continue without updating status
        pass

    serialized_task = json.dumps(task_data)
    await redis_client.lpush("inference_queue", serialized_task)
    await redis_client.lpush(f"inference_queue:{node_id}", serialized_task)

    try:
        result = await wait_for_result(task_id, timeout=120)
    except Exception:
        await payment_processor.refund(user_address, estimated_cost, task_id, {**metadata, "reason": "error"})
        raise

    if not result:
        await payment_processor.refund(user_address, estimated_cost, task_id, {**metadata, "reason": "timeout"})
        await task_store.update(
            task_id,
            {"status": "timeout", "completed_at": utc_now_iso(), "updated_at": utc_now_iso()},
        )
        await mark_node_available(node_id, success=False)
        raise HTTPException(status_code=504, detail="Inference timeout")

    actual_tokens = result.get("tokens_generated", payload.max_tokens)
    actual_cost = (actual_tokens / 1_000_000) * model_info.price_per_1m_tokens

    performance_metrics = {
        "uptime": 99.5,
        "actual_speed": result.get("tokens_per_second", model_info.tokens_per_second),
        "expected_speed": model_info.tokens_per_second,
        "accuracy": result.get("accuracy", 0.98),
    }

    await payment_processor.settle(
        user_address,
        estimated_cost,
        actual_cost,
        task_id,
        {**metadata, "actual_cost": actual_cost, "tokens_generated": actual_tokens},
    )

    adjustment = await update_gpu_node_score(node_id, performance_metrics)
    await payment_processor.distribute_rewards(task_id, actual_cost, node_id, adjustment)

    await task_store.update(
        task_id,
        {
            "status": result.get("status", "completed"),
            "result": result.get("text", ""),
            "tokens_generated": actual_tokens,
            "cost": actual_cost,
            "updated_at": utc_now_iso(),
            "completed_at": utc_now_iso(),
        },
    )

    await mark_node_available(node_id, success=True, task_id=task_id)

    return {
        "task_id": task_id,
        "result": result.get("text", ""),
        "tokens_used": actual_tokens,
        "cost": actual_cost,
        "model": payload.model_id,
    }


@app.websocket("/ws/inference/{task_id}")
async def inference_websocket(websocket: WebSocket, task_id: str) -> None:
    await websocket.accept()
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(f"task:{task_id}")
    try:
        async for message in pubsub.listen():
            if message.get("type") != "message":
                continue
            await websocket.send_text(message["data"])
    except Exception as exc:  # pragma: no cover - runtime communication path
        await websocket.send_json({"error": str(exc)})
    finally:
        await pubsub.unsubscribe(f"task:{task_id}")
        await pubsub.close()
        await websocket.close()


class NodeRegistration(BaseModel):
    wallet_address: str
    gpu_model: str
    vram_gb: int
    bandwidth_gbps: float
    location: Optional[str] = None
    notes: Optional[str] = None


@app.post("/api/node/register")
async def register_gpu_node(payload: NodeRegistration) -> Dict[str, Any]:
    node_id = f"node_{uuid.uuid4().hex[:10]}"
    supported_models = [
        model_id for model_id, info in MODEL_REGISTRY.items() if payload.vram_gb >= info.min_gpu_vram
    ]
    record = {
        "wallet_address": payload.wallet_address.lower(),
        "gpu_model": payload.gpu_model,
        "vram_gb": payload.vram_gb,
        "bandwidth_gbps": payload.bandwidth_gbps,
        "location": payload.location,
        "notes": payload.notes,
        "status": "available",
        "score": 100.0,
        "tasks_completed": 0,
        "uptime_seconds": 0,
        "supported_models": supported_models,
        "registered_at": utc_now_iso(),
        "last_heartbeat": utc_now_iso(),
    }
    await persist_gpu_node(node_id, record)
    return {
        "node_id": node_id,
        "status": "registered",
        "supported_models": supported_models,
        "record": record,
    }


@app.get("/api/network/status")
async def get_network_status() -> Dict[str, Any]:
    nodes = await get_gpu_nodes()
    total_nodes = len(nodes)
    available_nodes = sum(1 for node in nodes.values() if node.get("status") == "available")
    total_vram = sum(float(node.get("vram_gb", 0)) for node in nodes.values())
    average_score = (
        sum(float(node.get("score", 0)) for node in nodes.values()) / total_nodes if total_nodes else 0
    )

    return {
        "total_nodes": total_nodes,
        "available_nodes": available_nodes,
        "total_vram_gb": int(total_vram),
        "models_available": list(MODEL_REGISTRY.keys()),
        "average_node_score": round(average_score, 2),
    }


@app.get("/api/inference/tasks")
async def list_inference_tasks(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    user_address = await verify_jwt_token(credentials.credentials)
    tasks = await task_store.list_for_user(user_address)
    return {"tasks": tasks}


@app.get("/api/inference/tasks/{task_id}")
async def get_inference_task(
    task_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    user_address = await verify_jwt_token(credentials.credentials)
    task = await task_store.get(task_id)
    if not task or task.get("user_address") != user_address.lower():
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.get("/api/inference/activity")
async def inference_activity(
    credentials: HTTPAuthorizationCredentials = Depends(security), limit: int = 50
) -> Dict[str, Any]:
    user_address = await verify_jwt_token(credentials.credentials)
    tasks = await task_store.list_for_user(user_address, limit=limit)
    transactions = []
    for task in tasks:
        transactions.append(
            {
                "id": task["task_id"],
                "type": "inference",
                "amount": task.get("cost", 0.0),
                "asset": "FAR",
                "status": task.get("status", "pending"),
                "model": task.get("model"),
                "tokens": task.get("tokens_generated", task.get("max_tokens")),
                "timestamp": task.get("completed_at")
                or task.get("updated_at")
                or task.get("created_at"),
                "direction": "debit",
                "metadata": {"node_id": task.get("node_id")},
            }
        )
    return {"transactions": transactions}


if __name__ == "__main__":  # pragma: no cover - manual execution
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

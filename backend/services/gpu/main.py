from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import redis.asyncio as redis  # type: ignore[import-untyped]
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

NODE_REGISTRY_KEY = "gpu:nodes"
OWNER_INDEX_PREFIX = "gpu:owner:"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class NodeRegistration(BaseModel):
    wallet_address: str = Field(..., min_length=10)
    gpu_model: str
    vram_gb: int = Field(..., ge=1)
    bandwidth_gbps: float = Field(..., ge=0)
    location: Optional[str] = None
    notes: Optional[str] = None


class NodeHeartbeat(BaseModel):
    status: str = Field(..., pattern="^(available|busy|offline)$")
    temperature_c: Optional[float] = Field(default=None, ge=0.0, le=120.0)
    uptime_seconds: Optional[int] = Field(default=None, ge=0)
    tasks_completed: Optional[int] = Field(default=None, ge=0)


async def fetch_nodes() -> List[Dict[str, Any]]:
    records = await redis_client.hgetall(NODE_REGISTRY_KEY)
    return [
        {"node_id": node_id, **json.loads(payload)}
        for node_id, payload in records.items()
    ]


async def get_node(node_id: str) -> Dict[str, Any]:
    payload = await redis_client.hget(NODE_REGISTRY_KEY, node_id)
    if not payload:
        raise HTTPException(status_code=404, detail="Node not found")
    return {"node_id": node_id, **json.loads(payload)}


async def persist_node(node_id: str, record: Dict[str, Any]) -> None:
    stored = {k: v for k, v in record.items() if k != "node_id"}
    await redis_client.hset(NODE_REGISTRY_KEY, node_id, json.dumps(stored))
    owner_key = f"{OWNER_INDEX_PREFIX}{stored['wallet_address'].lower()}"
    await redis_client.sadd(owner_key, node_id)


app = FastAPI(title="Far Labs GPU Service")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "gpu"}


@app.get("/api/gpu/nodes")
async def list_nodes() -> Dict[str, Any]:
    items = await fetch_nodes()
    return {"nodes": items}


@app.post("/api/gpu/nodes", status_code=201)
async def register_node(payload: NodeRegistration) -> Dict[str, Any]:
    node_id = f"node_{uuid.uuid4().hex[:10]}"
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
        "temperature_c": None,
        "registered_at": utc_now_iso(),
        "last_heartbeat": utc_now_iso(),
    }
    await persist_node(node_id, record)
    return {"node_id": node_id, "record": record}


@app.get("/api/gpu/nodes/{node_id}")
async def get_node_detail(node_id: str) -> Dict[str, Any]:
    node = await get_node(node_id)
    return {"node_id": node_id, **node}


@app.post("/api/gpu/nodes/{node_id}/heartbeat")
async def heartbeat(node_id: str, payload: NodeHeartbeat) -> Dict[str, Any]:
    data = await get_node(node_id)
    updated = {**data, **payload.model_dump(exclude_unset=True)}
    updated["last_heartbeat"] = utc_now_iso()
    if payload.tasks_completed is not None:
        updated["tasks_completed"] = payload.tasks_completed
    await persist_node(node_id, updated)
    return {"node_id": node_id, "record": updated}


@app.get("/api/gpu/stats")
async def gpu_stats() -> Dict[str, Any]:
    nodes = await fetch_nodes()
    total = len(nodes)
    available = sum(1 for node in nodes if node.get("status") == "available")
    total_vram = sum(int(node.get("vram_gb", 0)) for node in nodes)
    avg_vram = (total_vram / total) if total else 0
    return {
        "total_nodes": total,
        "available_nodes": available,
        "total_vram_gb": total_vram,
        "average_vram_gb": round(avg_vram, 2),
    }


@app.get("/api/gpu/nodes/owner/{wallet_address}")
async def nodes_for_owner(wallet_address: str) -> Dict[str, Any]:
    owner_key = f"{OWNER_INDEX_PREFIX}{wallet_address.lower()}"
    node_ids = await redis_client.smembers(owner_key)
    nodes = []
    for node_id in node_ids:
        try:
            node = await get_node(node_id)
        except HTTPException:
            continue
        nodes.append({"node_id": node_id, **node})
    return {"nodes": nodes}

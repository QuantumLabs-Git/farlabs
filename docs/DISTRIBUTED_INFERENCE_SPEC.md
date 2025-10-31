# Far Labs Distributed Inference - Technical Specification

**Version**: 1.0
**Date**: January 2025
**Status**: Ready for Implementation
**Timeline**: 20 weeks (5 months)

---

## Executive Summary

Far Labs will build a distributed GPU marketplace that enables model-parallel inference across consumer and enterprise GPUs. The system leverages proven distributed inference technology (FarMesh/Hivemind) and adds blockchain payments, provider incentives, and quality guarantees.

**Key Differentiator**: First distributed AI inference marketplace with token-based payments for GPU providers.

**Core Technology**: FarMesh/Hivemind for distributed inference + custom payment/marketplace layer.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Phase 1: R&D Validation](#2-phase-1-rd-validation)
3. [Phase 2: Payment Integration](#3-phase-2-payment-integration)
4. [Phase 3: Production Deployment](#4-phase-3-production-deployment)
5. [Phase 4: Advanced Features](#5-phase-4-advanced-features)
6. [Phase 5: Scale & Optimization](#6-phase-5-scale--optimization)
7. [API Specifications](#7-api-specifications)
8. [Data Models](#8-data-models)
9. [Security & Compliance](#9-security--compliance)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Guide](#11-deployment-guide)
12. [Monitoring & Observability](#12-monitoring--observability)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Far Labs Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Frontend   │───▶│  API Gateway │───▶│   Auth/Pay   │     │
│  │   (Next.js)  │    │   (FastAPI)  │    │   Services   │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                             │                                    │
│                             ▼                                    │
│                    ┌──────────────────┐                         │
│                    │  Far Mesh Layer  │  ◄──── NEW             │
│                    │  (Payment Wrapper)│                        │
│                    └──────────────────┘                         │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Distributed Inference Network (FarMesh)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  Far Node 1  │◄──▶│  Far Node 2  │◄──▶│  Far Node N  │     │
│  │  (Layer 0-5) │    │ (Layer 6-15) │    │ (Layer 16+)  │     │
│  │  RTX 4090    │    │  A100 80GB   │    │   H100       │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         ▲                   ▲                    ▲              │
│         └───────────────────┴────────────────────┘              │
│                    DHT Peer Discovery                           │
│                  (Hivemind/libp2p)                              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Breakdown

#### Existing Platform (No Changes Required)
- **Frontend**: Next.js 14 dashboard
- **API Gateway**: FastAPI routing
- **Auth Service**: JWT-based authentication
- **Payment Service**: Escrow contracts (existing)
- **GPU Registry**: Node metadata (existing)

#### New Components (To Build)

**1. Far Mesh Coordinator** (`backend/services/far_mesh/`)
- Wraps FarMesh/Hivemind APIs
- Tracks inference sessions
- Credits providers per token/layer
- Routes requests to distributed swarm

**2. Far Node Server** (`backend/services/far_node/`)
- Runs on GPU provider machines
- Serves model layers via FarMesh
- Reports availability to platform
- Receives $FAR token payments

**3. Payment Tracker** (`backend/common/payment_tracker.py`)
- Monitors which nodes contribute to each inference
- Calculates fair split based on layers served
- Triggers escrow releases

**4. Discovery Service** (`backend/services/discovery/`)
- Public DHT for peer finding
- Health monitoring
- Geographic routing
- Provider scoring

---

## 2. Phase 1: R&D Validation

**Duration**: 2 weeks
**Goal**: Validate distributed inference works with our hardware mix
**Budget**: $150-200 (AWS GPU instances)

### 2.1 Objectives

1. Test FarMesh with 3-node cluster
2. Measure latency, throughput, bandwidth
3. Validate failure recovery
4. Document architecture decisions
5. Produce Phase 2 requirements

### 2.2 Deliverables

#### Infrastructure
- Terraform config for 3x g5.xlarge GPU nodes
- Bootstrap scripts (NVIDIA drivers, Docker, FarMesh)
- Monitoring scripts (GPU, network, logs)

#### Testing Scripts
- `test-far-client.py` - Basic inference test
- `benchmark-latency.py` - Token latency measurement
- `benchmark-throughput.py` - Multi-request load test
- `test-failure-recovery.py` - Node dropout simulation

#### Documentation
- **R&D Report** (`docs/PHASE1_REPORT.md`)
  - Executive summary
  - Performance metrics
  - Comparison: FarMesh vs Hivemind vs vLLM
  - Architecture recommendations
  - Risk assessment

- **Cost Analysis** (`docs/COST_ANALYSIS.md`)
  - Operational costs per model size
  - Provider hardware requirements
  - Network bandwidth projections

### 2.3 Success Criteria

- ✅ 3 nodes successfully run distributed inference
- ✅ Token latency < 500ms/token
- ✅ Throughput > 5 tokens/sec aggregate
- ✅ Graceful failure recovery when 1 node drops
- ✅ GPU memory < 15GB per node (for 7B model)
- ✅ Network bandwidth < 200 Mbps between nodes

### 2.4 Implementation Tasks

| Task | Owner | Effort | Depends On |
|------|-------|--------|------------|
| Create Terraform infrastructure | DevOps | 1 day | - |
| Write bootstrap scripts | DevOps | 2 days | Terraform |
| Set up monitoring | Backend | 2 days | Bootstrap |
| Run baseline tests | QA | 3 days | Monitoring |
| Run failure tests | QA | 2 days | Baseline |
| Write R&D report | Tech Lead | 3 days | Tests |

**Total**: 13 person-days over 2 weeks

---

## 3. Phase 2: Payment Integration

**Duration**: 4 weeks
**Goal**: Add payment layer on top of FarMesh
**Deliverables**: Working payments for distributed inference

### 3.1 Architecture

```python
# High-level flow
1. User requests inference via API Gateway
2. Far Mesh Coordinator receives request
3. Coordinator queries Discovery Service for available nodes
4. Coordinator initiates FarMesh distributed session
5. Payment Tracker monitors which nodes contribute
6. Inference completes, tokens streamed to user
7. Payment Tracker calculates splits
8. Escrow releases $FAR to providers
```

### 3.2 Components to Build

#### 3.2.1 Far Mesh Coordinator

**File**: `backend/services/far_mesh/coordinator.py`

```python
from farmesh import AutoDistributedModelForCausalLM
from transformers import AutoTokenizer
import torch
from typing import AsyncIterator
from ..common.payment_tracker import PaymentTracker
from ..common.discovery import DiscoveryClient

class FarMeshCoordinator:
    """
    Wraps FarMesh distributed inference with payment tracking.
    """

    def __init__(
        self,
        model_id: str,
        discovery_url: str,
        payment_contract_address: str
    ):
        self.model_id = model_id
        self.discovery = DiscoveryClient(discovery_url)
        self.payment_tracker = PaymentTracker(payment_contract_address)

        # Load FarMesh distributed model
        self.model = AutoDistributedModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float16,
        )
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)

    async def generate_streaming(
        self,
        prompt: str,
        max_tokens: int,
        user_wallet: str,
        request_id: str
    ) -> AsyncIterator[str]:
        """
        Stream tokens from distributed inference with payment tracking.

        Args:
            prompt: User prompt
            max_tokens: Max tokens to generate
            user_wallet: User's wallet address for payment
            request_id: Unique request ID

        Yields:
            Generated tokens as they arrive
        """
        # Start payment session
        session = self.payment_tracker.start_session(
            request_id=request_id,
            user_wallet=user_wallet,
            model_id=self.model_id
        )

        try:
            # Tokenize prompt
            inputs = self.tokenizer(prompt, return_tensors="pt")

            # Get active nodes from discovery
            active_nodes = await self.discovery.get_active_nodes(
                model_id=self.model_id
            )

            # Track which nodes are serving which layers
            session.set_active_nodes(active_nodes)

            # Generate with FarMesh
            with torch.inference_mode():
                for output in self.model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    do_sample=True,
                    temperature=0.7,
                    stream=True  # Stream tokens as they're generated
                ):
                    token = self.tokenizer.decode(
                        output[0][-1:],
                        skip_special_tokens=True
                    )

                    # Track token generation for payment
                    session.record_token(
                        token=token,
                        contributing_nodes=self._get_contributing_nodes()
                    )

                    yield token

            # Finalize and release payments
            await session.finalize()

        except Exception as e:
            # Rollback payment on failure
            await session.rollback()
            raise

    def _get_contributing_nodes(self) -> list[str]:
        """
        Query FarMesh to see which nodes handled the last forward pass.
        Returns list of node IDs.
        """
        # FarMesh tracks this internally via transformer_blocks
        # We'll expose it via custom hooks
        return self.model.get_last_contributing_servers()
```

**Dependencies**:
- `farmesh==2.3.0`
- `transformers==4.38.0`
- `torch==2.2.0`

**Configuration**:
```yaml
# config/far_mesh.yaml
models:
  - id: "meta-llama/Llama-2-7b-chat-hf"
    min_nodes: 3
    payment_per_token: 0.0001  # $FAR per token

  - id: "meta-llama/Llama-2-70b-chat-hf"
    min_nodes: 8
    payment_per_token: 0.001

discovery:
  dht_bootstrap: "far-discovery.farlabs.ai:31337"
  health_check_interval: 30  # seconds

payments:
  escrow_contract: "0x..."
  release_delay: 3600  # 1 hour after inference
```

#### 3.2.2 Payment Tracker

**File**: `backend/common/payment_tracker.py`

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List
import asyncio
from web3 import Web3
from redis import Redis

@dataclass
class InferenceSession:
    request_id: str
    user_wallet: str
    model_id: str
    started_at: datetime
    active_nodes: List[Dict]
    token_count: int = 0
    node_contributions: Dict[str, int] = None  # node_id -> token count

    def __post_init__(self):
        if self.node_contributions is None:
            self.node_contributions = {}

class PaymentTracker:
    """
    Tracks inference sessions and calculates provider payments.
    """

    def __init__(
        self,
        escrow_contract_address: str,
        redis_url: str,
        web3_provider: str
    ):
        self.escrow_address = escrow_contract_address
        self.redis = Redis.from_url(redis_url)
        self.w3 = Web3(Web3.HTTPProvider(web3_provider))

        # Load escrow contract ABI
        self.escrow_contract = self.w3.eth.contract(
            address=escrow_contract_address,
            abi=self._load_escrow_abi()
        )

    def start_session(
        self,
        request_id: str,
        user_wallet: str,
        model_id: str
    ) -> InferenceSession:
        """
        Start tracking a new inference session.
        """
        session = InferenceSession(
            request_id=request_id,
            user_wallet=user_wallet,
            model_id=model_id,
            started_at=datetime.utcnow(),
            active_nodes=[]
        )

        # Store in Redis for recovery
        self.redis.setex(
            f"inference_session:{request_id}",
            3600,  # 1 hour TTL
            session.to_json()
        )

        return session

    def record_token(
        self,
        session: InferenceSession,
        token: str,
        contributing_nodes: List[str]
    ):
        """
        Record that a token was generated by specific nodes.
        """
        session.token_count += 1

        # Credit each contributing node
        for node_id in contributing_nodes:
            if node_id not in session.node_contributions:
                session.node_contributions[node_id] = 0
            session.node_contributions[node_id] += 1

        # Update Redis
        self.redis.setex(
            f"inference_session:{session.request_id}",
            3600,
            session.to_json()
        )

    async def finalize(self, session: InferenceSession):
        """
        Complete inference and release payments to providers.
        """
        # Calculate total cost
        payment_per_token = self._get_payment_rate(session.model_id)
        total_cost = session.token_count * payment_per_token

        # Calculate splits based on contribution
        payments = {}
        for node_id, tokens_contributed in session.node_contributions.items():
            # Proportional payment
            node_share = (tokens_contributed / session.token_count)
            payment_amount = total_cost * node_share

            # Get node wallet
            node_wallet = await self._get_node_wallet(node_id)
            payments[node_wallet] = payment_amount

        # Release from escrow
        await self._release_escrow_payments(
            request_id=session.request_id,
            payments=payments
        )

        # Log completion
        await self._log_inference_complete(session, payments)

    async def rollback(self, session: InferenceSession):
        """
        Rollback failed inference, return funds to user.
        """
        # Cancel escrow
        await self._cancel_escrow(session.request_id)

        # Log failure
        await self._log_inference_failed(session)

    async def _release_escrow_payments(
        self,
        request_id: str,
        payments: Dict[str, float]
    ):
        """
        Call escrow contract to release payments.
        """
        # Build transaction
        tx = self.escrow_contract.functions.releaseMultiple(
            request_id=request_id,
            recipients=list(payments.keys()),
            amounts=[
                self.w3.to_wei(amount, 'ether')
                for amount in payments.values()
            ]
        ).build_transaction({
            'from': self.platform_wallet,
            'gas': 500000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.platform_wallet)
        })

        # Sign and send
        signed_tx = self.w3.eth.account.sign_transaction(
            tx,
            private_key=self.platform_private_key
        )
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Wait for confirmation
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return receipt

    def _get_payment_rate(self, model_id: str) -> float:
        """
        Get payment per token for this model.
        """
        # Load from config or database
        rates = {
            "meta-llama/Llama-2-7b-chat-hf": 0.0001,
            "meta-llama/Llama-2-70b-chat-hf": 0.001,
        }
        return rates.get(model_id, 0.0001)

    async def _get_node_wallet(self, node_id: str) -> str:
        """
        Look up wallet address for a node ID.
        """
        # Query GPU registry service
        response = await self.http_client.get(
            f"http://gpu-service/nodes/{node_id}"
        )
        return response.json()["wallet_address"]
```

#### 3.2.3 Discovery Service

**File**: `backend/services/discovery/main.py`

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio
from redis import Redis

app = FastAPI(title="Far Discovery Service")

class NodeRegistration(BaseModel):
    node_id: str
    wallet_address: str
    model_id: str
    layers_served: List[int]  # e.g., [0, 1, 2, 3, 4, 5]
    gpu_model: str
    vram_gb: int
    location: str  # Geographic location
    public_addr: str  # IP:PORT for P2P

class NodeHealth(BaseModel):
    node_id: str
    model_id: str
    is_healthy: bool
    latency_ms: float
    throughput_tokens_per_sec: float
    last_seen: datetime

class DiscoveryService:
    def __init__(self, redis_url: str):
        self.redis = Redis.from_url(redis_url)

    async def register_node(self, registration: NodeRegistration):
        """
        Register a Far Node in the discovery DHT.
        """
        key = f"node:{registration.node_id}"

        # Store node metadata
        self.redis.hset(key, mapping={
            "wallet_address": registration.wallet_address,
            "model_id": registration.model_id,
            "layers_served": ",".join(map(str, registration.layers_served)),
            "gpu_model": registration.gpu_model,
            "vram_gb": registration.vram_gb,
            "location": registration.location,
            "public_addr": registration.public_addr,
            "registered_at": datetime.utcnow().isoformat()
        })

        # Add to model index
        self.redis.sadd(
            f"model_nodes:{registration.model_id}",
            registration.node_id
        )

        # Set TTL (node must heartbeat to stay active)
        self.redis.expire(key, 120)  # 2 minutes

    async def heartbeat(self, health: NodeHealth):
        """
        Node heartbeat to maintain registration.
        """
        key = f"node:{health.node_id}"

        # Update health metrics
        self.redis.hset(key, mapping={
            "is_healthy": str(health.is_healthy),
            "latency_ms": health.latency_ms,
            "throughput": health.throughput_tokens_per_sec,
            "last_seen": datetime.utcnow().isoformat()
        })

        # Refresh TTL
        self.redis.expire(key, 120)

    async def get_active_nodes(
        self,
        model_id: str,
        location: Optional[str] = None
    ) -> List[Dict]:
        """
        Get all active nodes serving a model.
        """
        node_ids = self.redis.smembers(f"model_nodes:{model_id}")

        nodes = []
        for node_id in node_ids:
            node_data = self.redis.hgetall(f"node:{node_id}")

            if not node_data:
                continue  # Node expired

            # Filter by location if specified
            if location and node_data.get("location") != location:
                continue

            # Only return healthy nodes
            if node_data.get("is_healthy") == "True":
                nodes.append({
                    "node_id": node_id,
                    **node_data
                })

        return nodes

@app.post("/nodes/register")
async def register_node(registration: NodeRegistration):
    service = DiscoveryService(redis_url=settings.REDIS_URL)
    await service.register_node(registration)
    return {"status": "registered", "node_id": registration.node_id}

@app.post("/nodes/heartbeat")
async def heartbeat(health: NodeHealth):
    service = DiscoveryService(redis_url=settings.REDIS_URL)
    await service.heartbeat(health)
    return {"status": "ok"}

@app.get("/nodes/active/{model_id}")
async def get_active_nodes(model_id: str, location: Optional[str] = None):
    service = DiscoveryService(redis_url=settings.REDIS_URL)
    nodes = await service.get_active_nodes(model_id, location)
    return {"nodes": nodes, "count": len(nodes)}
```

#### 3.2.4 Far Node Server

**File**: `backend/services/far_node/server.py`

```python
#!/usr/bin/env python3
"""
Far Node Server - Runs on GPU provider machines.
Serves model layers via FarMesh and reports to discovery service.
"""

import asyncio
import argparse
from farmesh.server.from_pretrained import load_pretrained_block
from farmesh.server import run_server
from farmesh.constants import PUBLIC_INITIAL_PEERS
import httpx
from datetime import datetime

class FarNodeServer:
    def __init__(
        self,
        model_id: str,
        wallet_address: str,
        discovery_url: str,
        public_addr: str,
        gpu_index: int = 0
    ):
        self.model_id = model_id
        self.wallet_address = wallet_address
        self.discovery_url = discovery_url
        self.public_addr = public_addr
        self.gpu_index = gpu_index
        self.node_id = None
        self.http_client = httpx.AsyncClient()

    async def start(self):
        """
        Start the Far Node server.
        """
        print(f"Starting Far Node for model: {self.model_id}")
        print(f"Wallet: {self.wallet_address}")
        print(f"Discovery: {self.discovery_url}")

        # Generate node ID
        self.node_id = f"{self.wallet_address[:8]}-{self.gpu_index}"

        # Register with discovery service
        await self.register()

        # Start heartbeat task
        heartbeat_task = asyncio.create_task(self.heartbeat_loop())

        # Start FarMesh server
        await run_server(
            model_name_or_path=self.model_id,
            public_name=self.public_addr,
            device=f"cuda:{self.gpu_index}",
            torch_dtype="float16",
            initial_peers=PUBLIC_INITIAL_PEERS,  # Connect to public FarMesh DHT
            throughput=1.0,
            num_blocks=None,  # Auto-determine based on available VRAM
            on_accept_request=self._on_request_accepted,
            on_complete_request=self._on_request_completed
        )

    async def register(self):
        """
        Register node with Far Discovery service.
        """
        # Detect GPU info
        import torch
        gpu_name = torch.cuda.get_device_name(self.gpu_index)
        vram_gb = torch.cuda.get_device_properties(self.gpu_index).total_memory / 1e9

        response = await self.http_client.post(
            f"{self.discovery_url}/nodes/register",
            json={
                "node_id": self.node_id,
                "wallet_address": self.wallet_address,
                "model_id": self.model_id,
                "layers_served": [],  # Will be populated by FarMesh
                "gpu_model": gpu_name,
                "vram_gb": int(vram_gb),
                "location": "unknown",  # TODO: Detect via GeoIP
                "public_addr": self.public_addr
            }
        )
        response.raise_for_status()
        print(f"✓ Registered as node: {self.node_id}")

    async def heartbeat_loop(self):
        """
        Send periodic heartbeats to discovery service.
        """
        while True:
            try:
                await self.http_client.post(
                    f"{self.discovery_url}/nodes/heartbeat",
                    json={
                        "node_id": self.node_id,
                        "model_id": self.model_id,
                        "is_healthy": True,
                        "latency_ms": 50,  # TODO: Measure actual
                        "throughput_tokens_per_sec": 10,  # TODO: Measure actual
                        "last_seen": datetime.utcnow().isoformat()
                    }
                )
            except Exception as e:
                print(f"Heartbeat failed: {e}")

            await asyncio.sleep(30)  # Every 30 seconds

    def _on_request_accepted(self, request_id: str):
        """
        Called when this node accepts an inference request.
        """
        print(f"Accepted request: {request_id}")

    def _on_request_completed(self, request_id: str, tokens_generated: int):
        """
        Called when this node completes its part of inference.
        """
        print(f"Completed request: {request_id}, tokens: {tokens_generated}")

def main():
    parser = argparse.ArgumentParser(description="Far Node Server")
    parser.add_argument("--model", required=True, help="Model ID")
    parser.add_argument("--wallet", required=True, help="Wallet address")
    parser.add_argument("--discovery-url", required=True, help="Discovery service URL")
    parser.add_argument("--public-addr", required=True, help="Public IP:PORT")
    parser.add_argument("--gpu", type=int, default=0, help="GPU index")

    args = parser.parse_args()

    server = FarNodeServer(
        model_id=args.model,
        wallet_address=args.wallet,
        discovery_url=args.discovery_url,
        public_addr=args.public_addr,
        gpu_index=args.gpu
    )

    asyncio.run(server.start())

if __name__ == "__main__":
    main()
```

**Usage**:
```bash
# On GPU provider machine
python3 -m far_node.server \
    --model meta-llama/Llama-2-7b-chat-hf \
    --wallet 0xYourWalletAddress \
    --discovery-url https://discovery.farlabs.ai \
    --public-addr your-public-ip:31330
```

### 3.3 API Endpoints

#### Inference API

**POST** `/api/inference/distributed/generate`

Request:
```json
{
  "model_id": "meta-llama/Llama-2-7b-chat-hf",
  "prompt": "The benefits of distributed compute are",
  "max_tokens": 100,
  "temperature": 0.7,
  "stream": true
}
```

Response (Server-Sent Events):
```
data: {"token": "The", "request_id": "req_123"}
data: {"token": " benefits", "request_id": "req_123"}
data: {"token": " of", "request_id": "req_123"}
...
data: {"done": true, "total_tokens": 100, "cost_far": 0.01}
```

#### Node Management

**POST** `/api/nodes/register-distributed`
- Register GPU to serve distributed model layers

**POST** `/api/nodes/heartbeat`
- Keep node registration active

**GET** `/api/nodes/earnings/{wallet_address}`
- Get provider earnings from distributed inference

### 3.4 Database Schema

**inference_sessions** table:
```sql
CREATE TABLE inference_sessions (
    id UUID PRIMARY KEY,
    request_id VARCHAR(255) UNIQUE NOT NULL,
    user_wallet VARCHAR(42) NOT NULL,
    model_id VARCHAR(255) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    token_count INTEGER DEFAULT 0,
    total_cost_far DECIMAL(20, 8),
    status VARCHAR(20),  -- 'pending', 'active', 'completed', 'failed'
    CONSTRAINT check_status CHECK (status IN ('pending', 'active', 'completed', 'failed'))
);

CREATE INDEX idx_sessions_user ON inference_sessions(user_wallet);
CREATE INDEX idx_sessions_status ON inference_sessions(status);
```

**node_contributions** table:
```sql
CREATE TABLE node_contributions (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES inference_sessions(id),
    node_id VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    tokens_contributed INTEGER NOT NULL,
    payment_far DECIMAL(20, 8) NOT NULL,
    paid_at TIMESTAMP
);

CREATE INDEX idx_contributions_session ON node_contributions(session_id);
CREATE INDEX idx_contributions_wallet ON node_contributions(wallet_address);
```

**node_registry** table:
```sql
CREATE TABLE node_registry (
    node_id VARCHAR(255) PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    model_id VARCHAR(255) NOT NULL,
    gpu_model VARCHAR(100),
    vram_gb INTEGER,
    location VARCHAR(100),
    public_addr VARCHAR(255),
    registered_at TIMESTAMP NOT NULL,
    last_seen TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    total_tokens_served BIGINT DEFAULT 0,
    total_earned_far DECIMAL(20, 8) DEFAULT 0
);

CREATE INDEX idx_registry_model ON node_registry(model_id);
CREATE INDEX idx_registry_wallet ON node_registry(wallet_address);
CREATE INDEX idx_registry_active ON node_registry(is_active);
```

### 3.5 Testing Plan

#### Unit Tests
```python
# tests/test_payment_tracker.py
import pytest
from backend.common.payment_tracker import PaymentTracker

@pytest.mark.asyncio
async def test_payment_split_equal_contribution():
    """Test payment splits when nodes contribute equally."""
    tracker = PaymentTracker(...)
    session = tracker.start_session(...)

    # Simulate 100 tokens, 50 from node1, 50 from node2
    for i in range(50):
        tracker.record_token(session, f"token{i}", ["node1"])
        tracker.record_token(session, f"token{i+50}", ["node2"])

    await tracker.finalize(session)

    # Verify 50/50 split
    payments = tracker.get_payments(session.request_id)
    assert payments["node1"] == payments["node2"]

# tests/test_far_mesh.py
@pytest.mark.asyncio
async def test_distributed_inference():
    """Test end-to-end distributed inference with payment."""
    coordinator = FarMeshCoordinator(...)

    tokens = []
    async for token in coordinator.generate_streaming(
        prompt="Test prompt",
        max_tokens=10,
        user_wallet="0x123",
        request_id="test_req"
    ):
        tokens.append(token)

    assert len(tokens) == 10
    # Verify payments released
    ...
```

#### Integration Tests
- Deploy to staging with 3 real GPU nodes
- Run inference end-to-end
- Verify payments released to providers
- Test failure scenarios (node dropout)

### 3.6 Deployment

```bash
# Backend services
cd backend/services/far_mesh
docker build -t farlabs/far-mesh:latest .
docker push farlabs/far-mesh:latest

# Discovery service
cd backend/services/discovery
docker build -t farlabs/far-discovery:latest .
docker push farlabs/far-discovery:latest

# Deploy to ECS
aws ecs update-service \
    --cluster farlabs-cluster-free \
    --service far-mesh \
    --force-new-deployment
```

### 3.7 Success Criteria

- ✅ API endpoint `/api/inference/distributed/generate` works
- ✅ Payments split correctly among providers
- ✅ Discovery service tracks active nodes
- ✅ Node registration/heartbeat flow works
- ✅ Token streaming works (SSE)
- ✅ Integration tests pass

---

## 4. Phase 3: Production Deployment

**Duration**: 4 weeks
**Goal**: Launch public Far Mesh network
**Deliverables**: Live distributed inference marketplace

### 4.1 Components

#### 4.1.1 Public Discovery DHT

Deploy public discovery service:
- **URL**: `https://discovery.farlabs.ai`
- **Capacity**: Handle 1000+ nodes
- **Uptime**: 99.9% SLA
- **Geographic distribution**: Multi-region (US, EU, APAC)

**Infrastructure**:
```yaml
# k8s/discovery-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: far-discovery
spec:
  replicas: 3
  selector:
    matchLabels:
      app: far-discovery
  template:
    metadata:
      labels:
        app: far-discovery
    spec:
      containers:
      - name: discovery
        image: farlabs/far-discovery:latest
        ports:
        - containerPort: 8000
        - containerPort: 31337  # DHT port
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

#### 4.1.2 Provider Onboarding Flow

**Frontend** (`frontend/src/app/gpu/distributed/page.tsx`):

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function DistributedNodeSetup() {
  const [wallet, setWallet] = useState('');
  const [modelId, setModelId] = useState('meta-llama/Llama-2-7b-chat-hf');

  const generateSetupCommand = () => {
    return `# Install Far Node software
curl -sSL https://get.farlabs.ai/node | bash

# Start Far Node
far-node start \\
  --model ${modelId} \\
  --wallet ${wallet} \\
  --discovery https://discovery.farlabs.ai \\
  --auto-update
`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Join Far Mesh Network</h1>
      <p className="text-white/60">
        Earn $FAR tokens by contributing your GPU to distributed AI inference.
        Your GPU will serve model layers alongside other providers.
      </p>

      <Card>
        <h2 className="text-2xl font-semibold mb-4">Requirements</h2>
        <ul className="space-y-2">
          <li>✓ NVIDIA GPU with 16GB+ VRAM (RTX 3090, 4090, A100, H100)</li>
          <li>✓ 100+ Mbps internet connection</li>
          <li>✓ Ubuntu 20.04+ or similar Linux distribution</li>
          <li>✓ Docker installed</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-2xl font-semibold mb-4">Setup</h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-2">Your Wallet Address</label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded"
            />
          </div>

          <div>
            <label className="block mb-2">Model to Serve</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded"
            >
              <option value="meta-llama/Llama-2-7b-chat-hf">
                Llama 2 7B Chat (~14GB VRAM)
              </option>
              <option value="meta-llama/Llama-2-13b-chat-hf">
                Llama 2 13B Chat (~26GB VRAM)
              </option>
              <option value="meta-llama/Llama-2-70b-chat-hf">
                Llama 2 70B Chat (requires multiple GPUs)
              </option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Installation Command</label>
            <pre className="p-4 bg-black/50 rounded overflow-x-auto">
              <code>{generateSetupCommand()}</code>
            </pre>
            <Button
              onClick={() => navigator.clipboard.writeText(generateSetupCommand())}
              className="mt-2"
            >
              Copy Command
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-semibold mb-4">Estimated Earnings</h2>
        <p className="text-3xl text-brand-soft">$120-500/month</p>
        <p className="text-white/60 mt-2">
          Based on RTX 4090 serving Llama 2 7B, ~50% uptime.
          Actual earnings vary based on demand and node reliability.
        </p>
      </Card>
    </div>
  );
}
```

#### 4.1.3 Client SDK

**Python SDK** (`farlabs-sdk/`):

```python
# setup.py
from setuptools import setup, find_packages

setup(
    name="farlabs",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "httpx>=0.24.0",
        "web3>=6.0.0",
        "pydantic>=2.0.0"
    ],
    description="Far Labs distributed inference SDK",
    author="Far Labs",
    python_requires=">=3.10",
)

# farlabs/client.py
import httpx
from typing import AsyncIterator, Optional
from web3 import Web3

class FarLabsClient:
    """
    Client for Far Labs distributed inference API.
    """

    def __init__(
        self,
        api_url: str = "https://api.farlabs.ai",
        wallet_address: Optional[str] = None,
        private_key: Optional[str] = None
    ):
        self.api_url = api_url
        self.wallet_address = wallet_address
        self.private_key = private_key
        self.http_client = httpx.AsyncClient(
            base_url=api_url,
            timeout=300.0
        )

    async def generate(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 100,
        temperature: float = 0.7,
        stream: bool = True
    ) -> AsyncIterator[str]:
        """
        Generate text using Far Mesh distributed inference.

        Args:
            model: Model ID (e.g., "meta-llama/Llama-2-7b-chat-hf")
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            stream: Stream tokens as they're generated

        Yields:
            Generated tokens
        """
        # Get auth token
        auth_token = await self._get_auth_token()

        # Stream inference
        async with self.http_client.stream(
            "POST",
            "/api/inference/distributed/generate",
            json={
                "model_id": model,
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": stream
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    import json
                    data = json.loads(line[6:])
                    if "token" in data:
                        yield data["token"]
                    elif "done" in data:
                        break

    async def _get_auth_token(self) -> str:
        """
        Get JWT token by signing with wallet.
        """
        # Sign message with wallet
        from eth_account.messages import encode_defunct
        w3 = Web3()
        message = f"Far Labs Login: {self.wallet_address}"
        encoded_msg = encode_defunct(text=message)
        signed_msg = w3.eth.account.sign_message(
            encoded_msg,
            private_key=self.private_key
        )

        # Exchange signature for JWT
        response = await self.http_client.post(
            "/api/auth/login",
            json={
                "wallet_address": self.wallet_address,
                "signature": signed_msg.signature.hex(),
                "message": message
            }
        )
        return response.json()["token"]

# Example usage:
async def main():
    client = FarLabsClient(
        wallet_address="0xYourWallet",
        private_key="your_private_key"
    )

    print("Prompt: The future of AI is")
    async for token in client.generate(
        model="meta-llama/Llama-2-7b-chat-hf",
        prompt="The future of AI is",
        max_tokens=50
    ):
        print(token, end="", flush=True)
```

**JavaScript/TypeScript SDK**:

```typescript
// packages/farlabs-js/src/index.ts
import { ethers } from 'ethers';

export interface GenerateOptions {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export class FarLabsClient {
  private apiUrl: string;
  private wallet?: ethers.Wallet;

  constructor(
    apiUrl: string = 'https://api.farlabs.ai',
    privateKey?: string
  ) {
    this.apiUrl = apiUrl;
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey);
    }
  }

  async *generate(options: GenerateOptions): AsyncGenerator<string> {
    const authToken = await this.getAuthToken();

    const response = await fetch(`${this.apiUrl}/api/inference/distributed/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        model_id: options.model,
        prompt: options.prompt,
        max_tokens: options.maxTokens ?? 100,
        temperature: options.temperature ?? 0.7,
        stream: options.stream ?? true
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.token) {
            yield data.token;
          } else if (data.done) {
            return;
          }
        }
      }
    }
  }

  private async getAuthToken(): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    const message = `Far Labs Login: ${this.wallet.address}`;
    const signature = await this.wallet.signMessage(message);

    const response = await fetch(`${this.apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: this.wallet.address,
        signature,
        message
      })
    });

    const { token } = await response.json();
    return token;
  }
}

// Example usage:
const client = new FarLabsClient(
  'https://api.farlabs.ai',
  process.env.PRIVATE_KEY
);

for await (const token of client.generate({
  model: 'meta-llama/Llama-2-7b-chat-hf',
  prompt: 'The future of AI is',
  maxTokens: 50
})) {
  process.stdout.write(token);
}
```

### 4.2 Monitoring & Analytics

#### Provider Dashboard

**Frontend** (`frontend/src/app/provider/dashboard/page.tsx`):

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ProviderStats {
  totalTokensServed: number;
  totalEarnedFar: number;
  activeRequests: number;
  uptime: number;
  avgLatencyMs: number;
}

export default function ProviderDashboard() {
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [earnings, setEarnings] = useState<Array<{date: string, amount: number}>>([]);

  useEffect(() => {
    // Fetch provider stats
    fetch('/api/provider/stats')
      .then(r => r.json())
      .then(setStats);

    // Fetch earnings history
    fetch('/api/provider/earnings/history')
      .then(r => r.json())
      .then(setEarnings);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Provider Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-sm text-white/60 mb-2">Total Earned</h3>
          <p className="text-3xl font-bold text-brand-soft">
            {stats.totalEarnedFar.toFixed(2)} FAR
          </p>
        </Card>

        <Card>
          <h3 className="text-sm text-white/60 mb-2">Tokens Served</h3>
          <p className="text-3xl font-bold">
            {stats.totalTokensServed.toLocaleString()}
          </p>
        </Card>

        <Card>
          <h3 className="text-sm text-white/60 mb-2">Uptime</h3>
          <p className="text-3xl font-bold text-emerald-400">
            {stats.uptime.toFixed(1)}%
          </p>
        </Card>

        <Card>
          <h3 className="text-sm text-white/60 mb-2">Avg Latency</h3>
          <p className="text-3xl font-bold">
            {stats.avgLatencyMs.toFixed(0)}ms
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-2xl font-semibold mb-4">Earnings History</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={earnings}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#8b5cf6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
```

### 4.3 Success Criteria

- ✅ 50+ active Far Nodes in production
- ✅ Public discovery DHT operational
- ✅ Provider onboarding < 15 minutes
- ✅ SDK examples and documentation published
- ✅ Dashboard shows real-time stats
- ✅ 99% uptime for core services

---

## 5. Phase 4: Advanced Features

**Duration**: 6 weeks
**Goal**: Feature parity with FarMesh + premium tiers

### 5.1 Quantization Support (8-bit/4-bit)

Enable low-VRAM nodes to participate:

```python
# In FarNodeServer
from transformers import BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_8bit=True,  # or load_in_4bit=True
    bnb_4bit_compute_dtype=torch.bfloat16
)

model = AutoDistributedModelForCausalLM.from_pretrained(
    model_id,
    quantization_config=quantization_config,
    device_map="auto"
)
```

**Benefits**:
- RTX 3060 (12GB) can serve 7B models
- RTX 4070 (12GB) can serve 13B models
- More providers can join

### 5.2 Adaptive Partitioning

Dynamically rebalance layers based on:
- Node join/leave events
- Performance metrics
- Geographic location

```python
class AdaptivePartitioner:
    """
    Automatically redistributes model layers across nodes.
    """

    async def rebalance(
        self,
        model_id: str,
        active_nodes: List[NodeInfo]
    ):
        """
        Rebalance layer distribution.
        """
        total_layers = self.get_layer_count(model_id)
        total_vram = sum(node.vram_gb for node in active_nodes)

        # Calculate ideal distribution
        for node in active_nodes:
            node_share = node.vram_gb / total_vram
            layers_for_node = int(total_layers * node_share)

            # Assign layers
            await self.assign_layers(node, layers_for_node)
```

### 5.3 Premium Tiers

**Standard Tier** (Public Mesh):
- Best-effort latency
- Variable availability
- $0.0001/token

**Premium Tier** (Reserved Capacity):
- < 200ms/token guaranteed
- 99.9% uptime SLA
- Priority routing
- $0.001/token

**Enterprise Tier** (Private Mesh):
- Dedicated node cluster
- Custom SLAs
- On-premise deployment option
- Custom pricing

Implementation:

```python
class TierManager:
    async def route_request(
        self,
        request: InferenceRequest,
        user_tier: str
    ) -> List[str]:
        """
        Route request based on user tier.
        """
        if user_tier == "enterprise":
            # Use dedicated cluster
            return await self.get_enterprise_nodes(request.enterprise_id)

        elif user_tier == "premium":
            # Use high-reliability nodes
            nodes = await self.discovery.get_active_nodes(request.model_id)
            return [n for n in nodes if n.reliability_score > 0.95]

        else:
            # Standard: any available nodes
            return await self.discovery.get_active_nodes(request.model_id)
```

### 5.4 Geographic Routing

Route requests to nearby nodes for lower latency:

```python
import geoip2.database

class GeographicRouter:
    def __init__(self, geoip_db_path: str):
        self.reader = geoip2.database.Reader(geoip_db_path)

    async def get_nearby_nodes(
        self,
        user_ip: str,
        model_id: str,
        max_distance_km: int = 1000
    ) -> List[NodeInfo]:
        """
        Find nodes within max_distance_km of user.
        """
        user_location = self.reader.city(user_ip)
        user_lat = user_location.location.latitude
        user_lon = user_location.location.longitude

        all_nodes = await self.discovery.get_active_nodes(model_id)

        nearby = []
        for node in all_nodes:
            node_lat, node_lon = self.get_node_location(node.id)
            distance = self.haversine_distance(
                user_lat, user_lon,
                node_lat, node_lon
            )

            if distance <= max_distance_km:
                nearby.append(node)

        return nearby
```

### 5.5 Success Criteria

- ✅ 8-bit quantization working
- ✅ Adaptive rebalancing tested
- ✅ Premium tier launched
- ✅ Enterprise customers onboarded
- ✅ Geographic routing reduces latency by 30%+

---

## 6. Phase 5: Scale & Optimization

**Duration**: 4 weeks
**Goal**: Production-scale distributed GPU marketplace

### 6.1 Large Model Support (100B+)

Enable BLOOM-176B, LLaMA-70B+:

```python
# Special handling for huge models
class LargeModelCoordinator(FarMeshCoordinator):
    async def load_large_model(
        self,
        model_id: str,
        min_nodes: int = 10
    ):
        """
        Load 100B+ model across many nodes.
        """
        # Wait for minimum nodes
        while True:
            nodes = await self.discovery.get_active_nodes(model_id)
            if len(nodes) >= min_nodes:
                break
            await asyncio.sleep(10)

        # Use compression
        self.model = AutoDistributedModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.bfloat16,
            low_cpu_mem_usage=True,
            load_in_8bit=True  # Compress to fit more nodes
        )
```

### 6.2 Cost Optimization

Dynamic pricing based on demand:

```python
class DynamicPricingEngine:
    async def get_current_price(
        self,
        model_id: str,
        time_of_day: int
    ) -> float:
        """
        Calculate price based on supply/demand.
        """
        available_nodes = await self.discovery.get_active_nodes(model_id)
        pending_requests = await self.get_queue_length(model_id)

        # Base price
        base_price = self.BASE_PRICES[model_id]

        # Surge pricing if demand > supply
        utilization = pending_requests / len(available_nodes)
        if utilization > 0.8:
            multiplier = 1.5
        elif utilization > 0.5:
            multiplier = 1.2
        else:
            multiplier = 1.0

        return base_price * multiplier
```

### 6.3 Advanced Monitoring

Distributed tracing with OpenTelemetry:

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Configure tracing
trace.set_tracer_provider(TracerProvider())
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger.farlabs.ai",
    agent_port=6831,
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)

tracer = trace.get_tracer(__name__)

# Instrument inference
@tracer.start_as_current_span("distributed_inference")
async def generate_with_tracing(...):
    with tracer.start_as_current_span("discovery"):
        nodes = await discovery.get_active_nodes(...)

    with tracer.start_as_current_span("inference"):
        result = await model.generate(...)

    with tracer.start_as_current_span("payment"):
        await payment_tracker.finalize(...)
```

### 6.4 Success Criteria

- ✅ Support for 70B+ models
- ✅ 500+ active nodes
- ✅ 10,000+ requests/day
- ✅ 99.9% uptime
- ✅ Dynamic pricing live
- ✅ Full distributed tracing

---

## 7. API Specifications

### 7.1 Inference API

**Base URL**: `https://api.farlabs.ai`

**Authentication**: JWT Bearer token (obtained via wallet signature)

#### POST /api/inference/distributed/generate

Generate text using distributed inference.

**Request**:
```json
{
  "model_id": "meta-llama/Llama-2-7b-chat-hf",
  "prompt": "The benefits of distributed compute are",
  "max_tokens": 100,
  "temperature": 0.7,
  "top_p": 0.9,
  "stream": true,
  "tier": "standard"  // or "premium", "enterprise"
}
```

**Response** (SSE):
```
data: {"token": "The", "request_id": "req_123abc"}
data: {"token": " benefits", "request_id": "req_123abc"}
...
data: {"done": true, "total_tokens": 95, "cost_far": 0.0095, "latency_ms": 450}
```

**Response** (Non-streaming):
```json
{
  "request_id": "req_123abc",
  "text": "The benefits of distributed compute are...",
  "tokens_generated": 95,
  "cost_far": 0.0095,
  "latency_ms": 450,
  "nodes_used": [
    {"node_id": "node1", "layers": [0, 1, 2, 3, 4, 5]},
    {"node_id": "node2", "layers": [6, 7, 8, 9, 10, 11]}
  ]
}
```

#### GET /api/inference/models

List available models for distributed inference.

**Response**:
```json
{
  "models": [
    {
      "id": "meta-llama/Llama-2-7b-chat-hf",
      "name": "Llama 2 7B Chat",
      "active_nodes": 42,
      "avg_latency_ms": 380,
      "price_per_token_far": 0.0001,
      "min_vram_gb": 14
    },
    {
      "id": "meta-llama/Llama-2-70b-chat-hf",
      "name": "Llama 2 70B Chat",
      "active_nodes": 12,
      "avg_latency_ms": 850,
      "price_per_token_far": 0.001,
      "min_vram_gb": 140
    }
  ]
}
```

### 7.2 Node Management API

#### POST /api/nodes/register-distributed

Register a node for distributed inference.

**Request**:
```json
{
  "wallet_address": "0xYourWallet",
  "model_id": "meta-llama/Llama-2-7b-chat-hf",
  "gpu_model": "NVIDIA RTX 4090",
  "vram_gb": 24,
  "public_addr": "1.2.3.4:31330",
  "location": "US-East",
  "signature": "0x..."  // Signature proving wallet ownership
}
```

**Response**:
```json
{
  "node_id": "node_abc123",
  "status": "registered",
  "discovery_url": "https://discovery.farlabs.ai",
  "heartbeat_interval_sec": 30
}
```

#### POST /api/nodes/heartbeat

Keep node registration active.

**Request**:
```json
{
  "node_id": "node_abc123",
  "is_healthy": true,
  "latency_ms": 45,
  "throughput_tokens_per_sec": 12,
  "current_requests": 3
}
```

**Response**:
```json
{
  "status": "ok",
  "should_rebalance": false
}
```

#### GET /api/nodes/earnings/{wallet_address}

Get provider earnings.

**Response**:
```json
{
  "wallet_address": "0xYourWallet",
  "total_earned_far": 125.45,
  "total_tokens_served": 1254500,
  "active_nodes": 2,
  "avg_uptime_percent": 98.5,
  "pending_payout_far": 5.23,
  "earnings_history": [
    {"date": "2025-01-01", "amount_far": 4.20},
    {"date": "2025-01-02", "amount_far": 5.10}
  ]
}
```

### 7.3 Discovery API

#### GET /api/discovery/nodes/active/{model_id}

Get active nodes for a model.

**Response**:
```json
{
  "model_id": "meta-llama/Llama-2-7b-chat-hf",
  "total_nodes": 42,
  "nodes": [
    {
      "node_id": "node_abc123",
      "wallet_address": "0x...",
      "gpu_model": "RTX 4090",
      "vram_gb": 24,
      "location": "US-East",
      "layers_served": [0, 1, 2, 3, 4, 5],
      "reliability_score": 0.98,
      "avg_latency_ms": 45
    }
  ]
}
```

---

## 8. Data Models

### 8.1 Node Registry

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class NodeRegistration(BaseModel):
    node_id: str = Field(..., description="Unique node identifier")
    wallet_address: str = Field(..., regex="^0x[a-fA-F0-9]{40}$")
    model_id: str = Field(..., description="Model this node serves")
    gpu_model: str
    vram_gb: int = Field(..., ge=8, le=256)
    public_addr: str = Field(..., regex="^[\d.]+:\d+$")
    location: str
    registered_at: datetime
    last_seen: Optional[datetime]
    is_active: bool = True
    total_tokens_served: int = 0
    total_earned_far: float = 0.0
    reliability_score: float = Field(1.0, ge=0.0, le=1.0)

class NodeHealth(BaseModel):
    node_id: str
    model_id: str
    is_healthy: bool
    latency_ms: float = Field(..., ge=0)
    throughput_tokens_per_sec: float = Field(..., ge=0)
    current_requests: int = Field(0, ge=0)
    gpu_utilization_percent: float = Field(..., ge=0, le=100)
    vram_used_gb: float = Field(..., ge=0)
    last_seen: datetime = Field(default_factory=datetime.utcnow)
```

### 8.2 Inference Sessions

```python
from enum import Enum

class SessionStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"

class InferenceSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str
    user_wallet: str
    model_id: str
    prompt: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime]
    token_count: int = 0
    total_cost_far: float = 0.0
    status: SessionStatus = SessionStatus.PENDING
    tier: str = "standard"  # standard, premium, enterprise

class NodeContribution(BaseModel):
    session_id: str
    node_id: str
    wallet_address: str
    tokens_contributed: int
    payment_far: float
    paid_at: Optional[datetime]
```

### 8.3 Provider Stats

```python
class ProviderStats(BaseModel):
    wallet_address: str
    total_tokens_served: int
    total_earned_far: float
    active_nodes: int
    uptime_percent: float = Field(..., ge=0, le=100)
    avg_latency_ms: float
    reliability_score: float = Field(..., ge=0, le=1)
    total_requests_served: int
    failed_requests: int
```

---

## 9. Security & Compliance

### 9.1 Authentication

**Wallet-based auth**:
```python
from eth_account.messages import encode_defunct
from web3 import Web3

def verify_wallet_signature(
    wallet_address: str,
    message: str,
    signature: str
) -> bool:
    """
    Verify that signature was created by wallet owner.
    """
    w3 = Web3()
    encoded_msg = encode_defunct(text=message)
    recovered_address = w3.eth.account.recover_message(
        encoded_msg,
        signature=signature
    )
    return recovered_address.lower() == wallet_address.lower()
```

### 9.2 Payment Security

**Escrow contract** (Solidity):
```solidity
// contracts/InferenceEscrow.sol
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InferenceEscrow is Ownable {
    IERC20 public farToken;

    struct Escrow {
        address user;
        uint256 amount;
        bool released;
        bool cancelled;
    }

    mapping(bytes32 => Escrow) public escrows;

    event EscrowCreated(bytes32 indexed requestId, address user, uint256 amount);
    event EscrowReleased(bytes32 indexed requestId, address[] providers, uint256[] amounts);
    event EscrowCancelled(bytes32 indexed requestId);

    constructor(address _farToken) {
        farToken = IERC20(_farToken);
    }

    function createEscrow(
        bytes32 requestId,
        uint256 amount
    ) external {
        require(escrows[requestId].amount == 0, "Escrow exists");

        // Transfer FAR to escrow
        farToken.transferFrom(msg.sender, address(this), amount);

        escrows[requestId] = Escrow({
            user: msg.sender,
            amount: amount,
            released: false,
            cancelled: false
        });

        emit EscrowCreated(requestId, msg.sender, amount);
    }

    function releaseMultiple(
        bytes32 requestId,
        address[] calldata providers,
        uint256[] calldata amounts
    ) external onlyOwner {
        Escrow storage escrow = escrows[requestId];
        require(!escrow.released, "Already released");
        require(!escrow.cancelled, "Cancelled");
        require(providers.length == amounts.length, "Length mismatch");

        // Verify total
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        require(total <= escrow.amount, "Exceeds escrow");

        // Release to providers
        for (uint256 i = 0; i < providers.length; i++) {
            farToken.transfer(providers[i], amounts[i]);
        }

        // Return excess to user
        if (total < escrow.amount) {
            farToken.transfer(escrow.user, escrow.amount - total);
        }

        escrow.released = true;
        emit EscrowReleased(requestId, providers, amounts);
    }

    function cancel(bytes32 requestId) external {
        Escrow storage escrow = escrows[requestId];
        require(msg.sender == escrow.user || msg.sender == owner(), "Unauthorized");
        require(!escrow.released, "Already released");
        require(!escrow.cancelled, "Already cancelled");

        // Return to user
        farToken.transfer(escrow.user, escrow.amount);

        escrow.cancelled = true;
        emit EscrowCancelled(requestId);
    }
}
```

### 9.3 Rate Limiting

```python
from fastapi import HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/inference/distributed/generate")
@limiter.limit("100/hour")  # 100 requests per hour per IP
async def generate(request: Request, ...):
    ...
```

### 9.4 Data Privacy

- **No prompt logging**: Prompts never stored in logs
- **Ephemeral sessions**: Cleared after 1 hour
- **Encrypted transport**: TLS 1.3 for all connections
- **Provider isolation**: Nodes can't see full prompts, only their layer inputs

---

## 10. Testing Strategy

### 10.1 Unit Tests

```bash
# Run all unit tests
pytest backend/tests/unit/ -v

# Coverage
pytest backend/tests/unit/ --cov=backend --cov-report=html
```

### 10.2 Integration Tests

```python
# tests/integration/test_distributed_inference.py
import pytest
from backend.services.far_mesh.coordinator import FarMeshCoordinator

@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_inference_flow():
    """
    Test complete flow from request to payment.
    Requires 3 test nodes running.
    """
    coordinator = FarMeshCoordinator(
        model_id="meta-llama/Llama-2-7b-chat-hf",
        discovery_url="http://localhost:8001",
        payment_contract_address="0x..."
    )

    tokens = []
    async for token in coordinator.generate_streaming(
        prompt="Test prompt",
        max_tokens=20,
        user_wallet="0xTestWallet",
        request_id="test_req_123"
    ):
        tokens.append(token)

    assert len(tokens) == 20

    # Verify payments released
    tracker = coordinator.payment_tracker
    session = tracker.get_session("test_req_123")
    assert session.status == "completed"
    assert len(session.node_contributions) >= 2  # At least 2 nodes contributed
```

### 10.3 Load Tests

```python
# tests/load/test_concurrent_requests.py
import asyncio
from locust import HttpUser, task, between

class InferenceUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def generate_text(self):
        self.client.post("/api/inference/distributed/generate", json={
            "model_id": "meta-llama/Llama-2-7b-chat-hf",
            "prompt": "Test prompt",
            "max_tokens": 10,
            "stream": False
        })

# Run:
# locust -f tests/load/test_concurrent_requests.py --host https://api.farlabs.ai
```

---

## 11. Deployment Guide

### 11.1 Prerequisites

- Kubernetes cluster (EKS, GKE, or self-hosted)
- PostgreSQL 15+ database
- Redis 7+ cluster
- Docker registry access
- BSC node access for smart contract interactions

### 11.2 Environment Setup

```bash
# Create namespace
kubectl create namespace farlabs-mesh

# Create secrets
kubectl create secret generic far-mesh-secrets \
    --from-literal=jwt-secret=your_jwt_secret \
    --from-literal=escrow-private-key=your_private_key \
    --from-literal=db-password=your_db_password \
    -n farlabs-mesh

# Deploy PostgreSQL (or use managed service)
helm install postgresql bitnami/postgresql \
    --set auth.password=your_db_password \
    -n farlabs-mesh

# Deploy Redis (or use managed service)
helm install redis bitnami/redis \
    --set auth.password=your_redis_password \
    -n farlabs-mesh
```

### 11.3 Deploy Services

```bash
# Build and push images
docker build -t farlabs/far-mesh:v0.1.0 backend/services/far_mesh
docker push farlabs/far-mesh:v0.1.0

docker build -t farlabs/far-discovery:v0.1.0 backend/services/discovery
docker push farlabs/far-discovery:v0.1.0

# Deploy to Kubernetes
kubectl apply -f k8s/far-mesh-deployment.yaml
kubectl apply -f k8s/far-discovery-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Verify
kubectl get pods -n farlabs-mesh
kubectl logs -f deployment/far-mesh -n farlabs-mesh
```

### 11.4 Deploy Smart Contract

```bash
# Compile contract
cd contracts
npx hardhat compile

# Deploy to BSC testnet
npx hardhat run scripts/deploy-escrow.js --network bscTestnet

# Verify on BscScan
npx hardhat verify --network bscTestnet DEPLOYED_ADDRESS

# Update backend config with contract address
kubectl set env deployment/far-mesh \
    ESCROW_CONTRACT_ADDRESS=0x... \
    -n farlabs-mesh
```

---

## 12. Monitoring & Observability

### 12.1 Metrics

**Prometheus metrics**:
```python
from prometheus_client import Counter, Histogram, Gauge

# Inference metrics
inference_requests = Counter(
    'far_mesh_inference_requests_total',
    'Total inference requests',
    ['model_id', 'tier', 'status']
)

inference_latency = Histogram(
    'far_mesh_inference_latency_seconds',
    'Inference latency',
    ['model_id', 'tier']
)

active_nodes = Gauge(
    'far_mesh_active_nodes',
    'Number of active nodes',
    ['model_id']
)

# Payment metrics
payments_released = Counter(
    'far_mesh_payments_released_total',
    'Total payments released',
    ['currency']
)

payments_amount = Counter(
    'far_mesh_payments_amount_far',
    'Total FAR paid to providers'
)
```

### 12.2 Logging

```python
import structlog

logger = structlog.get_logger()

logger.info(
    "inference_started",
    request_id=request_id,
    model_id=model_id,
    user_wallet=user_wallet,
    tier=tier
)

logger.info(
    "inference_completed",
    request_id=request_id,
    tokens_generated=token_count,
    latency_ms=latency,
    nodes_used=len(contributing_nodes),
    cost_far=total_cost
)
```

### 12.3 Alerting

**Prometheus alerts** (`k8s/alerts.yaml`):
```yaml
groups:
- name: far_mesh
  rules:
  - alert: HighInferenceLatency
    expr: histogram_quantile(0.95, far_mesh_inference_latency_seconds) > 1.0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High inference latency detected"

  - alert: LowNodeCount
    expr: far_mesh_active_nodes < 3
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Not enough active nodes for {{$labels.model_id}}"
```

---

## 13. Timeline & Milestones

| Phase | Duration | Start Date | End Date | Key Deliverables |
|-------|----------|------------|----------|------------------|
| Phase 1: R&D | 2 weeks | Week 1 | Week 2 | R&D report, architecture validated |
| Phase 2: Payments | 4 weeks | Week 3 | Week 6 | Payment integration working |
| Phase 3: Production | 4 weeks | Week 7 | Week 10 | Public mesh live, SDK released |
| Phase 4: Advanced | 6 weeks | Week 11 | Week 16 | Quantization, premium tiers |
| Phase 5: Scale | 4 weeks | Week 17 | Week 20 | 100B+ models, 500+ nodes |

**Total Timeline**: 20 weeks (~5 months)

---

## 14. Team & Resources

### 14.1 Required Roles

| Role | Responsibilities | Estimated Effort |
|------|-----------------|------------------|
| Backend Lead | Coordinate implementation, architecture decisions | Full-time (20 weeks) |
| Backend Dev 1 | Payment tracker, escrow integration | Full-time (16 weeks) |
| Backend Dev 2 | Discovery service, monitoring | Full-time (12 weeks) |
| Smart Contract Dev | Escrow contract, testing | Part-time (8 weeks) |
| Frontend Dev | Provider dashboard, SDK docs | Part-time (8 weeks) |
| DevOps Engineer | Infrastructure, deployment | Part-time (12 weeks) |
| QA Engineer | Testing, validation | Part-time (16 weeks) |

### 14.2 Infrastructure Costs

**Phase 1 (R&D)**:
- 3x g5.xlarge spot instances: ~$50-75/week

**Phase 2-3 (Development)**:
- Staging environment: ~$300/month
- Database/Redis: ~$100/month

**Phase 4-5 (Production)**:
- Discovery service (3 replicas): ~$200/month
- Far Mesh coordinator (5 replicas): ~$500/month
- Database/Redis production: ~$400/month
- Monitoring (Prometheus, Grafana): ~$100/month

**Total**: ~$1,200/month + node payouts

---

## 15. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| FarMesh library bugs/limitations | High | Medium | Contribute fixes upstream, fork if needed |
| Insufficient provider adoption | High | Medium | Incentive campaigns, lower barriers to entry |
| Payment disputes | Medium | Low | Clear SLAs, automatic resolution via smart contracts |
| Network attacks (DDoS) | High | Low | Rate limiting, DDoS protection (Cloudflare) |
| Regulatory issues (crypto payments) | Medium | Low | Legal review, geographic restrictions if needed |
| High latency degrading UX | High | Medium | Geographic routing, premium tiers, SLAs |

---

## 16. Success Metrics

### 16.1 Phase 1 Success
- [ ] 3 nodes distributed inference working
- [ ] < 500ms/token latency
- [ ] Graceful failure recovery tested
- [ ] R&D report completed

### 16.2 Phase 2 Success
- [ ] Payment tracking accurate
- [ ] Escrow contract deployed and tested
- [ ] Provider receives correct payment
- [ ] Integration tests pass

### 16.3 Phase 3 Success
- [ ] 50+ active nodes
- [ ] Public mesh operational
- [ ] SDK published to PyPI/npm
- [ ] Provider onboarding < 15 min

### 16.4 Phase 4 Success
- [ ] Quantization working
- [ ] Premium tiers launched
- [ ] 100+ active nodes
- [ ] Enterprise customer signed

### 16.5 Phase 5 Success
- [ ] 500+ active nodes
- [ ] 70B+ model support
- [ ] 10,000+ daily requests
- [ ] 99.9% uptime achieved

---

## 17. Appendix

### 17.1 Glossary

- **Far Mesh**: Far Labs' distributed inference network
- **Far Node**: GPU provider node serving model layers
- **Far Discovery**: Peer discovery and health monitoring service
- **Layer Distribution**: Splitting model layers across nodes
- **Tensor Streaming**: Passing activations between nodes
- **DHT**: Distributed Hash Table for peer discovery

### 17.2 References

- [FarMesh GitHub](https://github.com/QuantumLabs-Git/farmesh)
- [Hivemind Paper](https://arxiv.org/abs/2103.03239)
- [BigScience Workshop](https://bigscience.huggingface.co/)
- [Transformers Library](https://huggingface.co/docs/transformers)

### 17.3 Contact

- **Project Lead**: [Name]
- **Backend Team**: [Email]
- **Smart Contract Team**: [Email]
- **DevOps Team**: [Email]

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Status**: ✅ Ready for Implementation

---

**Next Steps**:
1. Review and approve this specification
2. Provision Phase 1 R&D infrastructure
3. Begin Phase 1 experiments
4. Weekly progress reviews with stakeholders
5. Phase 1 report due: Week 2
6. Kickoff Phase 2 development: Week 3


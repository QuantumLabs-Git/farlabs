#!/usr/bin/env python3
"""
Far Discovery Service - DHT Bootstrap and Node Registry

This service provides:
1. DHT bootstrap nodes for Far Mesh network
2. Node discovery and registration API
3. Health monitoring and node tracking
4. Public API for finding active nodes
"""

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import asyncpg
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Database connection pool
db_pool: Optional[asyncpg.Pool] = None


class NodeRegistration(BaseModel):
    """Node registration request"""
    wallet_address: str = Field(..., description="Ethereum wallet address")
    model_id: str = Field(..., description="Model being served (e.g., meta-llama/Llama-2-7b-chat-hf)")
    public_addr: str = Field(..., description="Public address (IP:port)")
    peer_id: str = Field(..., description="Libp2p peer ID")
    gpu_model: str
    vram_total_gb: float
    num_blocks: int = Field(..., description="Number of transformer blocks served")
    torch_dtype: str = Field(default="float16")


class NodeHeartbeat(BaseModel):
    """Node heartbeat update"""
    vram_available_gb: float
    tokens_served_since_last: int = 0
    status: str = Field(default="active")


class NodeInfo(BaseModel):
    """Public node information"""
    node_id: str
    peer_id: str
    public_addr: str
    model_id: str
    num_blocks: int
    status: str
    last_heartbeat: datetime
    uptime_percentage: float


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global db_pool

    # Startup
    logger.info("=" * 60)
    logger.info("Far Discovery Service Starting")
    logger.info("=" * 60)

    # Connect to database
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL environment variable is required")
        raise ValueError("DATABASE_URL environment variable must be set")

    logger.info("Connecting to database...")
    db_pool = await asyncpg.create_pool(db_url, min_size=2, max_size=10)
    logger.info("✓ Database connected")

    # Start cleanup task
    cleanup_task = asyncio.create_task(cleanup_stale_nodes())

    logger.info("=" * 60)
    logger.info("✓ Far Discovery Service Ready")
    logger.info("=" * 60)

    yield

    # Shutdown
    logger.info("Shutting down Far Discovery Service...")
    cleanup_task.cancel()
    if db_pool:
        await db_pool.close()
    logger.info("✓ Far Discovery Service stopped")


app = FastAPI(
    title="Far Discovery Service",
    description="DHT bootstrap and node discovery for Far Mesh network",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://app.farlabs.ai").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "far-discovery",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/api/nodes/register", status_code=status.HTTP_201_CREATED)
async def register_node(registration: NodeRegistration):
    """
    Register a new Far Node

    Returns the assigned node_id which should be used for subsequent heartbeats.
    """
    async with db_pool.acquire() as conn:
        # Check if node already exists (by peer_id or public_addr)
        existing = await conn.fetchrow(
            """
            SELECT node_id FROM gpu_nodes
            WHERE peer_id = $1 OR public_address = $2
            LIMIT 1
            """,
            registration.peer_id,
            registration.public_addr
        )

        if existing:
            # Update existing node
            await conn.execute(
                """
                UPDATE gpu_nodes
                SET wallet_address = $1,
                    gpu_model = $2,
                    vram_gb = $3,
                    model_name = $4,
                    num_blocks = $5,
                    torch_dtype = $6,
                    status = 'online',
                    last_heartbeat = NOW(),
                    updated_at = NOW()
                WHERE node_id = $7
                """,
                registration.wallet_address,
                registration.gpu_model,
                registration.vram_total_gb,
                registration.model_id,
                registration.num_blocks,
                registration.torch_dtype,
                existing['node_id']
            )

            logger.info(f"Node re-registered: {existing['node_id']} (peer: {registration.peer_id})")
            return {
                "node_id": existing['node_id'],
                "status": "re-registered",
                "message": "Welcome back!"
            }

        # Register new node
        node_id = await conn.fetchval(
            """
            INSERT INTO gpu_nodes (
                wallet_address, gpu_model, vram_gb, bandwidth_gbps,
                location, node_type, model_name, status,
                public_address, peer_id, num_blocks, torch_dtype,
                last_heartbeat
            ) VALUES (
                $1, $2, $3, 10.0, 'Unknown', 'far_mesh', $4, 'online',
                $5, $6, $7, $8, NOW()
            )
            RETURNING node_id
            """,
            registration.wallet_address,
            registration.gpu_model,
            registration.vram_total_gb,
            registration.model_id,
            registration.public_addr,
            registration.peer_id,
            registration.num_blocks,
            registration.torch_dtype
        )

        logger.info(f"New node registered: {node_id} (peer: {registration.peer_id}, model: {registration.model_id})")

        return {
            "node_id": node_id,
            "status": "registered",
            "message": "Node successfully registered with Far Mesh network",
            "dht_bootstrap": os.getenv("DHT_BOOTSTRAP_ADDR", "/ip4/34.239.181.168/tcp/31337/p2p/QmBootstrapPeer")
        }


@app.put("/api/nodes/{node_id}/heartbeat")
async def node_heartbeat(node_id: str, heartbeat: NodeHeartbeat):
    """
    Update node heartbeat and status

    Nodes should send heartbeats every 30 seconds.
    """
    async with db_pool.acquire() as conn:
        # Update heartbeat
        result = await conn.execute(
            """
            UPDATE gpu_nodes
            SET last_heartbeat = NOW(),
                status = $1,
                updated_at = NOW()
            WHERE node_id = $2
            """,
            heartbeat.status,
            node_id
        )

        if result == "UPDATE 0":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Node {node_id} not found"
            )

        # Record tokens served if any
        if heartbeat.tokens_served_since_last > 0:
            await conn.execute(
                """
                UPDATE gpu_nodes
                SET total_tokens_processed = COALESCE(total_tokens_processed, 0) + $1
                WHERE node_id = $2
                """,
                heartbeat.tokens_served_since_last,
                node_id
            )

        return {
            "status": "ok",
            "node_id": node_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


@app.get("/api/nodes/active", response_model=List[NodeInfo])
async def get_active_nodes(model_id: Optional[str] = None):
    """
    Get list of active Far Mesh nodes

    Optionally filter by model_id.
    """
    async with db_pool.acquire() as conn:
        query = """
            SELECT
                node_id,
                peer_id,
                public_address,
                model_name,
                num_blocks,
                status,
                last_heartbeat,
                CASE
                    WHEN last_heartbeat > NOW() - INTERVAL '2 minutes' THEN 99.9
                    ELSE 0.0
                END as uptime_percentage
            FROM gpu_nodes
            WHERE node_type = 'far_mesh'
            AND status = 'online'
            AND last_heartbeat > NOW() - INTERVAL '5 minutes'
        """

        params = []
        if model_id:
            query += " AND model_name = $1"
            params.append(model_id)

        query += " ORDER BY last_heartbeat DESC"

        rows = await conn.fetch(query, *params)

        return [
            NodeInfo(
                node_id=row['node_id'],
                peer_id=row['peer_id'],
                public_addr=row['public_address'],
                model_id=row['model_name'],
                num_blocks=row['num_blocks'] or 0,
                status=row['status'],
                last_heartbeat=row['last_heartbeat'],
                uptime_percentage=row['uptime_percentage']
            )
            for row in rows
        ]


@app.get("/api/nodes/{node_id}")
async def get_node_details(node_id: str):
    """Get detailed information about a specific node"""
    async with db_pool.acquire() as conn:
        node = await conn.fetchrow(
            """
            SELECT
                node_id, wallet_address, gpu_model, vram_gb, model_name,
                num_blocks, torch_dtype, status, public_address, peer_id,
                last_heartbeat, created_at,
                COALESCE(total_tokens_processed, 0) as total_tokens_processed
            FROM gpu_nodes
            WHERE node_id = $1
            """,
            node_id
        )

        if not node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Node {node_id} not found"
            )

        return dict(node)


@app.get("/api/dht/bootstrap")
async def get_dht_bootstrap():
    """Get DHT bootstrap node addresses"""
    bootstrap_nodes = os.getenv(
        "DHT_BOOTSTRAP_NODES",
        "/ip4/34.239.181.168/tcp/31337/p2p/QmBootstrapPeer"
    ).split(",")

    return {
        "bootstrap_nodes": [node.strip() for node in bootstrap_nodes],
        "network": "far-mesh",
        "version": "1.0.0"
    }


@app.get("/api/stats")
async def get_network_stats():
    """Get network-wide statistics"""
    async with db_pool.acquire() as conn:
        stats = await conn.fetchrow(
            """
            SELECT
                COUNT(*) FILTER (WHERE status = 'online' AND last_heartbeat > NOW() - INTERVAL '5 minutes') as active_nodes,
                COUNT(*) as total_nodes,
                SUM(COALESCE(total_tokens_processed, 0)) as total_tokens_processed,
                COUNT(DISTINCT model_name) as models_served
            FROM gpu_nodes
            WHERE node_type = 'far_mesh'
            """
        )

        return {
            "active_nodes": stats['active_nodes'],
            "total_nodes_registered": stats['total_nodes'],
            "total_tokens_processed": stats['total_tokens_processed'],
            "models_served": stats['models_served'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


async def cleanup_stale_nodes():
    """Background task to mark stale nodes as offline"""
    while True:
        try:
            await asyncio.sleep(60)  # Run every minute

            async with db_pool.acquire() as conn:
                result = await conn.execute(
                    """
                    UPDATE gpu_nodes
                    SET status = 'offline'
                    WHERE node_type = 'far_mesh'
                    AND status = 'online'
                    AND last_heartbeat < NOW() - INTERVAL '5 minutes'
                    """
                )

                if result != "UPDATE 0":
                    count = int(result.split()[-1])
                    if count > 0:
                        logger.info(f"Marked {count} stale node(s) as offline")

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in cleanup task: {e}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

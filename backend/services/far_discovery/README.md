# Far Discovery Service

**Centralized discovery and registration service for Far Mesh network nodes.**

## Overview

The Far Discovery Service provides:

1. **Node Registration**: API for nodes to register when they come online
2. **DHT Bootstrap**: Provides bootstrap node addresses for P2P connectivity
3. **Node Discovery**: Public API to find active nodes serving specific models
4. **Health Monitoring**: Tracks node heartbeats and marks stale nodes offline
5. **Network Statistics**: Real-time stats about the Far Mesh network

## Architecture

```
Far Mesh Worker → Register → Far Discovery Service → Database
                              ↓                         ↓
                         DHT Bootstrap            Node Registry
                              ↓                         ↓
                         P2P Network    ←     API Clients
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Register Node
```bash
POST /api/nodes/register
Content-Type: application/json

{
  "wallet_address": "0x...",
  "model_id": "meta-llama/Llama-2-7b-chat-hf",
  "public_addr": "1.2.3.4:31330",
  "peer_id": "QmYHnEQLdf...",
  "gpu_model": "NVIDIA RTX 4090",
  "vram_total_gb": 24.0,
  "num_blocks": 11,
  "torch_dtype": "float16"
}
```

Response:
```json
{
  "node_id": "uuid-1234-5678",
  "status": "registered",
  "message": "Node successfully registered with Far Mesh network",
  "dht_bootstrap": "/ip4/34.239.181.168/tcp/31337/p2p/QmBootstrapPeer"
}
```

### Node Heartbeat
```bash
PUT /api/nodes/{node_id}/heartbeat
Content-Type: application/json

{
  "vram_available_gb": 21.5,
  "tokens_served_since_last": 142,
  "status": "active"
}
```

### Get Active Nodes
```bash
GET /api/nodes/active?model_id=meta-llama/Llama-2-7b-chat-hf
```

Response:
```json
[
  {
    "node_id": "uuid-1234-5678",
    "peer_id": "QmYHnEQLdf...",
    "public_addr": "1.2.3.4:31330",
    "model_id": "meta-llama/Llama-2-7b-chat-hf",
    "num_blocks": 11,
    "status": "online",
    "last_heartbeat": "2025-10-10T14:30:00Z",
    "uptime_percentage": 99.9
  }
]
```

### Get DHT Bootstrap Nodes
```bash
GET /api/dht/bootstrap
```

Response:
```json
{
  "bootstrap_nodes": [
    "/ip4/34.239.181.168/tcp/31337/p2p/QmBootstrapPeer"
  ],
  "network": "far-mesh",
  "version": "1.0.0"
}
```

### Get Network Stats
```bash
GET /api/stats
```

Response:
```json
{
  "active_nodes": 42,
  "total_nodes_registered": 157,
  "total_tokens_processed": 15847392,
  "models_served": 3,
  "timestamp": "2025-10-10T14:30:00Z"
}
```

## Deployment

### Using Docker

```bash
cd backend/services/far_discovery

# Build
docker build -t far-discovery:latest .

# Run
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e DHT_BOOTSTRAP_NODES="/ip4/..." \
  far-discovery:latest
```

### Using Python

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your settings

# Run
python main.py
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `DHT_BOOTSTRAP_NODES` | Comma-separated bootstrap nodes | `/ip4/1.2.3.4/tcp/31337/...` |
| `PORT` | HTTP server port | `8080` |

## Database Schema

The service uses the existing `gpu_nodes` table with these Far Mesh-specific fields:

- `node_type = 'far_mesh'`
- `peer_id` - Libp2p peer ID
- `public_address` - Public IP:port
- `num_blocks` - Number of transformer blocks served
- `torch_dtype` - Model precision (float16, int8, int4)

## Background Tasks

### Stale Node Cleanup

Runs every minute to mark nodes offline if they haven't sent a heartbeat in 5 minutes:

```python
async def cleanup_stale_nodes():
    """Mark stale nodes as offline"""
    await conn.execute("""
        UPDATE gpu_nodes
        SET status = 'offline'
        WHERE node_type = 'far_mesh'
        AND status = 'online'
        AND last_heartbeat < NOW() - INTERVAL '5 minutes'
    """)
```

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

### Logs

```bash
# Docker
docker logs -f far-discovery

# Python
# Logs output to stdout
```

### Metrics

Monitor these metrics:

- Active nodes count (should be > 0)
- Total tokens processed (should increase)
- API response times
- Database connection pool usage

## Security

- API is public (no authentication required for discovery)
- Nodes self-register using their wallet address
- Heartbeat updates only allowed for registered nodes
- Database credentials secured via environment variables

## License

© 2025 Far Labs. All rights reserved.

# Far Mesh Coordinator

The Far Mesh Coordinator is the central service that connects users to the Far Labs distributed GPU mesh network. It wraps Petals/Hivemind distributed inference with payment tracking and marketplace features.

## Overview

**What it does:**
- Connects to the Far Mesh DHT (peer-to-peer network of GPU providers)
- Routes inference requests through distributed GPU nodes
- Tracks which nodes contribute to each inference session
- Records usage metrics for $FAR token payments
- Streams tokens back to users as they're generated

**Technology Stack:**
- **Petals**: Open-source distributed inference engine (model parallelism)
- **Hivemind**: DHT-based peer discovery and coordination
- **FastAPI**: HTTP API server
- **PostgreSQL**: Usage tracking and payment records
- **Redis**: Session state and caching

## Architecture

```
┌──────────┐
│  User    │
└────┬─────┘
     │ HTTP/SSE
     ▼
┌─────────────────────────────────┐
│  Far Mesh Coordinator (this)    │
│  ┌───────────────────────────┐  │
│  │  FastAPI Server           │  │
│  └───────────┬───────────────┘  │
│              │                   │
│  ┌───────────▼───────────────┐  │
│  │  FarMeshCoordinator       │  │
│  │  - Wraps Petals           │  │
│  │  - Payment tracking       │  │
│  └───────────┬───────────────┘  │
└──────────────┼───────────────────┘
               │ Petals Protocol
               ▼
     ┌──────────────────┐
     │   Far Mesh DHT   │
     │  (Hivemind P2P)  │
     └────┬────┬────┬───┘
          │    │    │
      ┌───▼┐ ┌─▼──┐ ┌▼───┐
      │GPU1│ │GPU2│ │GPU3│  (Far Nodes running Petals servers)
      └────┘ └────┘ └────┘
```

## How Distributed Inference Works

1. **User sends prompt** → Far Mesh Coordinator
2. **Coordinator connects to DHT** → Discovers available GPU nodes
3. **Model layers are split** → Across multiple GPU nodes
   - Example: Llama-2-7B (32 layers) might be split:
     - GPU1: layers 0-10
     - GPU2: layers 11-21
     - GPU3: layers 22-31
4. **Inference runs distributed:**
   - Activations flow through GPU1 → GPU2 → GPU3
   - Each node processes its layers
   - Results passed via P2P network
5. **Tokens stream back** → User sees real-time generation
6. **Usage tracked** → Each node's contribution recorded for payment

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run server
python server.py
```

Server will start on `http://localhost:8100`

### Docker

```bash
# Build image
docker build -t far-mesh-coordinator .

# Run container
docker run -p 8100:8100 \
  -e FAR_MESH_DHT_BOOTSTRAP=/ip4/1.2.3.4/tcp/31337 \
  -e POSTGRES_URL=postgresql://... \
  far-mesh-coordinator
```

## API Endpoints

### GET /health
Health check

**Response:**
```json
{
  "status": "healthy",
  "service": "far-mesh-coordinator",
  "version": "0.1.0"
}
```

### GET /mesh/status
Get Far Mesh network status

**Response:**
```json
{
  "model_id": "meta-llama/Llama-2-7b-chat-hf",
  "active_nodes": 12,
  "active_sessions": 3,
  "price_per_token_far": "0.0001",
  "status": "connected"
}
```

### POST /inference/generate
Generate text using distributed inference (streaming)

**Request:**
```json
{
  "prompt": "Explain quantum computing in simple terms:",
  "max_tokens": 512,
  "temperature": 0.7,
  "top_p": 0.9,
  "user_wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "request_id": "req_abc123",
  "model_id": "meta-llama/Llama-2-7b-chat-hf"
}
```

**Response:** Server-Sent Events (SSE) stream

```
data: {"token": "Quantum", "request_id": "req_abc123", "tokens_generated": 1, "cost_far": "0.0001"}

data: {"token": " computing", "request_id": "req_abc123", "tokens_generated": 2, "cost_far": "0.0002"}

data: {"token": " uses", "request_id": "req_abc123", "tokens_generated": 3, "cost_far": "0.0003"}

...

data: {"done": true}
```

### GET /models
List available models in the mesh

**Response:**
```json
{
  "models": [
    {
      "model_id": "meta-llama/Llama-2-7b-chat-hf",
      "active_nodes": 12,
      "price_per_token_far": "0.0001",
      "status": "available"
    }
  ]
}
```

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DEFAULT_MODEL_ID` | HuggingFace model ID | `meta-llama/Llama-2-7b-chat-hf` |
| `PRICE_PER_TOKEN_FAR` | Price per generated token | `0.0001` |
| `FAR_MESH_DHT_BOOTSTRAP` | DHT bootstrap node address | Required |
| `POSTGRES_URL` | PostgreSQL connection URL | Required |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Payment Tracking

The coordinator tracks:
- **inference_sessions**: Each user request
- **node_contributions**: Which nodes helped with each session
- **token_count**: How many tokens each node generated
- **cost_far**: Total $FAR cost for the session

This data is used by the Payment Tracker service to distribute earnings to GPU providers.

## Development Roadmap

### Phase 2 (Current)
- ✅ Basic Petals integration
- ✅ Streaming inference API
- 🔄 Node tracking (currently placeholder)
- 🔄 Payment session management
- 🔄 Database persistence

### Phase 3 (Next)
- Multiple model support
- Advanced routing (geographic, latency-based)
- Quantization (8-bit, 4-bit)
- Adaptive partitioning

### Phase 4 (Future)
- Premium service tiers
- Dynamic pricing
- 100B+ parameter models
- Distributed tracing

## Troubleshooting

### Can't connect to DHT
- Check `FAR_MESH_DHT_BOOTSTRAP` is correct
- Ensure bootstrap node is running
- Verify network connectivity

### No active GPU nodes
- Nodes must be running Petals servers for the same model
- Check node logs for errors
- Verify nodes are connected to same DHT

### Inference slow/timing out
- Check GPU node health
- Verify network latency between nodes
- Consider using fewer layers per node

## Contributing

This service is part of the Far Labs GPU DePIN platform. See main repository for contribution guidelines.

## License

Proprietary - Far Labs 2025

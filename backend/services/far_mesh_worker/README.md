# Far Labs GPU Mesh Worker (Petals Server)

This worker runs Petals server blocks that participate in the distributed Far Mesh network. GPU providers download and run this service to contribute their hardware to the distributed inference mesh.

## Overview

**What it does:**
- Runs Petals server blocks hosting model layers
- Connects to the Far Labs DHT (Distributed Hash Table)
- Serves inference requests routed through the mesh
- Reports to the Far Mesh Coordinator for payment tracking
- Maintains heartbeats for availability monitoring

**Technology Stack:**
- **Petals**: Open-source distributed inference engine
- **Hivemind**: DHT-based peer discovery
- **PyTorch**: Model inference engine
- **pynvml**: GPU monitoring

## Architecture

```
┌──────────────────────────────────┐
│   Far Mesh Coordinator           │
│   (Routes user requests)         │
└────────────┬─────────────────────┘
             │
             │ Petals P2P Protocol
             ▼
      ┌──────────────┐
      │  Far Mesh    │
      │  DHT Network │
      └──────┬───────┘
             │
       ┌─────┴─────┐
       │           │
   ┌───▼───┐   ┌───▼───┐
   │Worker1│   │Worker2│ ◄─ YOUR GPU RUNS THIS
   │GPU 1  │   │GPU 2  │
   └───────┘   └───────┘
```

## Quick Start

### Docker (Recommended)

```bash
docker run --gpus all \
  -e FARLABS_WALLET_ADDRESS=0xYOUR_WALLET \
  -e FARLABS_DHT_BOOTSTRAP=/ip4/34.239.181.168/tcp/31337/p2p/QmBootstrapPeer \
  -e FARLABS_MODEL_NAME=meta-llama/Llama-2-7b-chat-hf \
  -e FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com \
  --restart unless-stopped \
  894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-far-mesh-worker-free:latest
```

### Python (Advanced)

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export FARLABS_WALLET_ADDRESS="0xYOUR_WALLET"
export FARLABS_DHT_BOOTSTRAP="/ip4/34.239.181.168/tcp/31337/p2p/QmBootstrapPeer"
export FARLABS_MODEL_NAME="meta-llama/Llama-2-7b-chat-hf"
export FARLABS_API_BASE_URL="http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"

# Run worker
python main.py
```

## Configuration

Environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FARLABS_WALLET_ADDRESS` | Your wallet address for payments | - | Yes |
| `FARLABS_DHT_BOOTSTRAP` | DHT bootstrap node address | - | Yes |
| `FARLABS_MODEL_NAME` | HuggingFace model ID to serve | `meta-llama/Llama-2-7b-chat-hf` | No |
| `FARLABS_API_BASE_URL` | Far Labs API endpoint | - | Yes |
| `FARLABS_NUM_BLOCKS` | Number of model blocks to serve | Auto-detect based on VRAM | No |
| `FARLABS_TORCH_DTYPE` | Model dtype | `float16` | No |
| `FARLABS_LOCATION` | Your geographic location | `Unknown` | No |
| `FARLABS_HEARTBEAT_INTERVAL` | Seconds between heartbeats | `30` | No |

## Requirements

### Hardware
- NVIDIA GPU with at least 8GB VRAM (16GB+ recommended)
- Fast internet connection (10 Mbps+ upload)
- At least 50GB disk space for model weights

### Software
- Docker with NVIDIA Container Toolkit, OR
- Python 3.9+, CUDA 11.8+, and PyTorch 2.0+

## How It Works

### 1. Startup
- Worker registers with the Far Labs API
- Downloads model weights from HuggingFace
- Connects to the DHT bootstrap node
- Announces available model blocks

### 2. Operation
- Listens for inference requests via Petals P2P
- Processes model layers assigned to this worker
- Forwards activations to next worker in chain
- Reports metrics via heartbeats

### 3. Payment
- Coordinator tracks which workers contributed to each inference
- Workers earn $FAR tokens based on:
  - Number of tokens generated
  - Model layer complexity
  - Uptime and reliability score

## Monitoring

View your worker status:
- Check logs for "Connected to DHT" message
- Monitor GPU utilization (should increase during inference)
- Check heartbeat responses for earn rate estimates

## Troubleshooting

### Can't connect to DHT
- Verify `FARLABS_DHT_BOOTSTRAP` is correct
- Check firewall allows outbound P2P traffic
- Ensure internet connection is stable

### Model download fails
- Check disk space (models are 10-50GB)
- Verify HuggingFace model ID is correct
- Try clearing cache: `rm -rf ~/.cache/huggingface`

### Low earnings
- Ensure GPU is properly detected (`nvidia-smi`)
- Check uptime (workers need 95%+ uptime for best rates)
- Verify you're serving a model in demand

## Supported Models

Currently supported distributed models:
- `meta-llama/Llama-2-7b-chat-hf` (7B parameters)
- `meta-llama/Llama-2-13b-chat-hf` (13B parameters)
- `meta-llama/Llama-2-70b-chat-hf` (70B parameters)
- More models added regularly

## Safety & Security

- Worker only downloads official HuggingFace models
- No remote code execution
- Your private keys never leave your machine
- Only inference data flows through the network

## License

Proprietary - Far Labs 2025

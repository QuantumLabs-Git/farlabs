# Far Node Server - GPU Provider Software

**Earn $FAR tokens by providing GPU compute for distributed AI inference.**

This software turns your NVIDIA GPU into a node in the Far Labs mesh network, serving model layers for distributed inference and earning $FAR tokens for every token generated.

---

## Overview

### What is a Far Node?

A Far Node is a GPU server that:
- Runs Petals software to serve transformer model layers
- Registers with Far Labs discovery service
- Automatically participates in distributed inference requests
- Earns $FAR tokens for compute contributions

### How It Works

```
1. You run Far Node Server on your GPU machine
                ↓
2. Node registers with Far Labs discovery service
                ↓
3. Users request inference through Far Mesh Coordinator
                ↓
4. Your node serves model layers (e.g., layers 10-20 of Llama-2)
                ↓
5. You earn $FAR tokens based on tokens your node helps generate
                ↓
6. Earnings automatically tracked and paid to your wallet
```

### Example Earnings

**Llama-2-7B** (32 transformer blocks):
- Serving 10 blocks on 1x RTX 4090 (24GB VRAM)
- ~1000 inference requests/day
- ~500,000 tokens/day
- **Earnings**: ~50 FAR/day (at 0.0001 FAR/token)

*Actual earnings depend on network demand, your uptime, and hardware performance.*

---

## Requirements

### Hardware

**Minimum**:
- NVIDIA GPU with 16GB+ VRAM (e.g., RTX 4080, A4000)
- 4+ CPU cores
- 16GB+ system RAM
- 50GB+ free disk space
- Stable internet connection (10+ Mbps upload)

**Recommended**:
- NVIDIA GPU with 24GB+ VRAM (e.g., RTX 4090, A5000, A6000)
- 8+ CPU cores
- 32GB+ system RAM
- 100GB+ SSD storage
- 100+ Mbps connection

### Software

- Ubuntu 20.04+ or Debian 11+ (Linux required)
- NVIDIA drivers 525+ with CUDA 12.1+
- Python 3.10 or 3.11
- Open port 31330 (TCP) for incoming connections

---

## Quick Start

### 1. Download Far Node Software

```bash
# Clone repository or download release
git clone https://github.com/farlabs/far-node-server.git
cd far-node-server
```

### 2. Run Setup Script

```bash
chmod +x start-far-node.sh
./start-far-node.sh
```

The setup script will:
- ✓ Check your GPU and system requirements
- ✓ Prompt for your Ethereum wallet address
- ✓ Let you choose which model to serve
- ✓ Install all dependencies in a virtual environment
- ✓ Create configuration file

### 3. Start Earning

```bash
./run-far-node.sh
```

You should see:

```
============================================
Far Node Server Initialization
============================================
Detecting hardware...
  GPU: NVIDIA GeForce RTX 4090 (1x)
  VRAM: 22.5 GB / 24.0 GB available
  CPU: 16 cores
  RAM: 28.3 GB / 32.0 GB available

Starting Petals server for model: meta-llama/Llama-2-7b-chat-hf
  Serving 11 transformer blocks
  Precision: float16
  Port: 31330
  ✓ Petals server started
  Node ID: QmYHnEQLdf...

Registering with Far Labs discovery service...
  ✓ Registered with discovery service
  Status: active

============================================
✓ Far Node Server is ready and earning $FAR!
============================================
Wallet: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
Model: meta-llama/Llama-2-7b-chat-hf
Public Address: 203.0.113.42:31330
============================================

[Heartbeat] Tokens: 1847 | Earned: 0.1847 FAR | VRAM: 21.2GB
```

### 4. Monitor Earnings

Visit **https://app.farlabs.ai/provider** and connect your wallet to see:
- Real-time earnings
- Tokens served
- Node uptime
- Performance metrics

---

## Configuration

### Environment Variables

Edit `.env` file to customize:

```bash
# Your Ethereum wallet address (REQUIRED)
FAR_NODE_WALLET=0x742d35Cc6634C0532925a3b844Bc454e4438f44e

# Model to serve (affects VRAM usage)
FAR_NODE_MODEL=meta-llama/Llama-2-7b-chat-hf

# Public IP or domain (auto-detect if not set)
FAR_NODE_PUBLIC_ADDR=auto

# Port for incoming connections
FAR_NODE_PORT=31330

# Precision (float16, int8, or int4)
# Lower precision = less VRAM, slightly lower quality
FAR_NODE_DTYPE=float16

# Far Labs service URLs
FAR_DISCOVERY_URL=https://discovery.farlabs.ai
FAR_MESH_DHT_BOOTSTRAP=/ip4/discovery.farlabs.ai/tcp/31337
```

### Advanced Configuration

**Serve more blocks** (if you have more VRAM):
```bash
# Auto-detect based on VRAM (default)
FAR_NODE_NUM_BLOCKS=auto

# Or manually specify (e.g., serve 16 blocks)
FAR_NODE_NUM_BLOCKS=16
```

**Use int8 quantization** (half the VRAM, ~10% slower):
```bash
FAR_NODE_DTYPE=int8
```

---

## Networking Setup

### Port Forwarding

Your node **must be accessible from the internet** on port 31330.

**For home routers:**
1. Find your router's admin panel (usually 192.168.1.1)
2. Navigate to Port Forwarding settings
3. Forward **external port 31330** to **your machine's local IP:31330**
4. Save settings

**For cloud providers** (AWS, GCP, Azure):
- Add firewall rule allowing TCP port 31330 inbound
- Example AWS: Add rule to security group for port 31330

### Verify Port is Open

```bash
# From another machine, test connectivity:
nc -zv YOUR_PUBLIC_IP 31330

# Should see: "Connection succeeded"
```

---

## Troubleshooting

### "No NVIDIA GPU detected"

**Solution**: Install NVIDIA drivers and CUDA toolkit:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nvidia-driver-535 nvidia-cuda-toolkit
sudo reboot

# Verify installation
nvidia-smi
```

### "Failed to register with discovery service"

**Possible causes**:
- Discovery service is down (check https://status.farlabs.ai)
- Your firewall is blocking outbound HTTPS
- Invalid wallet address

**Solution**:
- Check your FAR_NODE_WALLET in .env file
- Ensure you can reach https://discovery.farlabs.ai from your machine

### "Out of memory" errors

**Solution**: Reduce number of blocks served:
```bash
# In .env, set:
FAR_NODE_NUM_BLOCKS=8

# Or use int8 quantization:
FAR_NODE_DTYPE=int8
```

### Low or no earnings

**Possible causes**:
- Port 31330 not accessible from internet
- Low network demand
- Node offline or unstable
- Other nodes outperforming yours

**Solutions**:
- Verify port forwarding is set up correctly
- Check uptime - aim for 99%+
- Use faster GPU with more VRAM
- Serve popular models (Llama-2-7B has highest demand)

---

## Payments

### How Payments Work

1. **Real-time tracking**: Every time your node helps generate a token, it's recorded in the Far Labs database
2. **Batched payments**: Earnings are batched and paid out weekly to reduce gas fees
3. **Automatic**: No action needed - payments sent to your wallet automatically
4. **Transparent**: View all contributions and payments on-chain

### Payment Schedule

- **Frequency**: Weekly (every Monday at 00:00 UTC)
- **Minimum**: 10 FAR (earnings below this roll over to next week)
- **Network**: BNB Smart Chain (low gas fees)

### View Payment History

```bash
# Check your wallet on BscScan:
https://bscscan.com/address/YOUR_WALLET_ADDRESS

# Or view in provider dashboard:
https://app.farlabs.ai/provider
```

---

## Running as a System Service

To run your Far Node 24/7 in the background:

### Using systemd (Linux)

Create service file:

```bash
sudo nano /etc/systemd/system/far-node.service
```

Add:

```ini
[Unit]
Description=Far Labs GPU Node
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/far-node-server
ExecStart=/path/to/far-node-server/run-far-node.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable far-node
sudo systemctl start far-node

# Check status
sudo systemctl status far-node

# View logs
sudo journalctl -u far-node -f
```

---

## Monitoring & Logs

### Real-time Logs

```bash
# If running in terminal, logs appear automatically

# If running as service:
sudo journalctl -u far-node -f
```

### Key Metrics to Monitor

- **Heartbeat frequency**: Should see heartbeat every 30 seconds
- **VRAM usage**: Should stay below 90%
- **Tokens served**: Should increase steadily
- **Earnings**: Should grow proportionally to tokens served

### Alerts

Set up alerts for:
- Node offline > 5 minutes
- VRAM usage > 95%
- Earnings stopped increasing

---

## Upgrading

```bash
# Stop node
./stop-far-node.sh

# Pull latest updates
git pull origin main

# Reinstall dependencies
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Restart node
./run-far-node.sh
```

---

## Security

### Best Practices

✅ **DO**:
- Use a dedicated wallet for node earnings
- Keep your private keys secure and never share them
- Run node on a dedicated machine or VM
- Keep system and drivers up to date
- Monitor logs for suspicious activity

❌ **DON'T**:
- Never enter your private key into the Far Node software (only wallet address needed)
- Don't run as root unless necessary
- Don't expose other services on the same machine
- Don't use a wallet with large holdings for node operations

### Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 31330/tcp    # Far Node peer connections
sudo ufw allow 22/tcp        # SSH (if needed)
sudo ufw enable
```

---

## FAQ

### How much can I earn?

Earnings depend on:
- Network demand for inference
- Your hardware specs (better GPU = more blocks = more earnings)
- Uptime (aim for 99%+)
- Competition from other providers

**Typical earnings**:
- RTX 4090: 30-70 FAR/day
- A6000: 50-100 FAR/day
- 4x A100: 400-800 FAR/day

### What models can I serve?

Currently supported:
- ✅ Llama-2-7B (most demand)
- ✅ Llama-2-13B
- ✅ Llama-2-70B (requires multiple high-end GPUs)

Coming soon:
- Llama-3
- Mistral
- CodeLlama

### Can I serve multiple models?

Not yet - each node serves one model at a time. Future updates will support model switching.

### What if my node goes offline?

- Earnings stop while offline
- No penalties for downtime
- Node automatically re-registers when it comes back online
- Payments still processed for tokens served while online

### Can I run multiple nodes?

Yes! Run one node per GPU:
- Use different ports (31330, 31331, 31332, etc.)
- Use same or different wallets
- Each node registered independently

---

## Support

- **Documentation**: https://docs.farlabs.ai/provider
- **Discord**: https://discord.gg/farlabs
- **Email**: providers@farlabs.ai
- **Status Page**: https://status.farlabs.ai

---

## License

Far Node Server software is proprietary.
Usage permitted only for participating in the Far Labs network.

© 2025 Far Labs. All rights reserved.

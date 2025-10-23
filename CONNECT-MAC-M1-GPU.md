# Connect Your Mac M1 GPU to Far Labs Network

This guide shows you how to connect your Mac M1/M2/M3 GPU as a provider node in the Far Labs GPU De-Pin network and start earning $FAR tokens.

## What You'll Achieve

- Register your Mac M1 as a GPU node in the Far Labs network
- Start accepting and processing AI inference tasks
- Earn $FAR tokens for providing compute power
- Monitor your node's performance and earnings

## Prerequisites

- Mac with M1, M2, or M3 chip (Apple Silicon)
- macOS 12.0 or later
- Python 3.9+ (check with `python3 --version`)
- At least 8GB of RAM (16GB+ recommended)
- Stable internet connection

## Quick Start (5 Minutes)

### Step 1: Navigate to GPU Worker Directory

```bash
cd "/Volumes/PRO-G40/Development/Far Labs Codebase/backend/services/gpu_worker_client"
```

### Step 2: Set Up Python Environment

```bash
# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Get Your Authentication Token

First, get a JWT token for your wallet address:

```bash
# Replace with your actual wallet address
export YOUR_WALLET="0xYourWalletAddressHere"

# Get token and save it
export FAR_TOKEN=$(curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d "{\"wallet_address\":\"$YOUR_WALLET\",\"session_tag\":\"gpu-worker\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Verify token was obtained
echo "Token: ${FAR_TOKEN:0:50}..."
```

### Step 4: Configure Your GPU Worker

Create a configuration file with your settings:

```bash
cat > .env.local << EOF
# Far Labs API Configuration
FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
FARLABS_API_TOKEN=$FAR_TOKEN
FARLABS_REDIS_URL=redis://farlabs-redis-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:6379

# Your Wallet (where you'll receive payouts)
FARLABS_WALLET_ADDRESS=$YOUR_WALLET

# Hardware Profile (Auto-detected on M1/M2/M3)
FARLABS_GPU_MODEL=Apple-M1-GPU
FARLABS_VRAM_GB=8
FARLABS_BANDWIDTH_GBPS=1
FARLABS_LOCATION=Your-Location

# Executor Configuration
FARLABS_EXECUTOR=mock
FARLABS_HEARTBEAT_INTERVAL=30

# Optional: Enable token auto-refresh for long-running workers
FARLABS_AUTH_REFRESH_ENABLED=true
EOF
```

**Update these values:**
- `FARLABS_GPU_MODEL`: `Apple-M1-GPU`, `Apple-M2-GPU`, or `Apple-M3-GPU`
- `FARLABS_VRAM_GB`: `8` (M1/M2 base), `16` (M1 Pro/Max), `32` (M1 Ultra), `18` (M2 Pro), `36` (M2 Ultra), `48` (M3 Max), etc.
- `FARLABS_LOCATION`: e.g., `US-California`, `UK-London`, etc.

### Step 5: Start Your GPU Worker

```bash
# Use the local config
python -m farlabs_gpu_worker run --env-file .env.local
```

You should see output like:

```
[INFO] Far Labs GPU Worker starting...
[INFO] Registering GPU node...
[INFO] ✓ Registered as node_abc123xyz
[INFO] Starting heartbeat (30s interval)...
[INFO] Listening for inference tasks...
[INFO] ✓ Heartbeat sent (uptime: 30s, score: 100.0)
```

🎉 **Congratulations!** Your Mac M1 GPU is now connected to the Far Labs network!

---

## Upgrading to Real AI Inference (Earn More!)

The quick start uses `mock` mode for testing. To process **real AI models** and earn more:

### Step 1: Install PyTorch for Apple Silicon

```bash
# Activate your virtual environment first
source .venv/bin/activate

# Install PyTorch with MPS (Metal Performance Shaders) support
pip install torch torchvision torchaudio

# Install transformers for model loading
pip install transformers accelerate
```

### Step 2: Update Configuration for Real Inference

```bash
cat > .env.production << EOF
FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
FARLABS_API_TOKEN=$FAR_TOKEN
FARLABS_REDIS_URL=redis://farlabs-redis-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:6379
FARLABS_WALLET_ADDRESS=$YOUR_WALLET

# Hardware Profile
FARLABS_GPU_MODEL=Apple-M1-Pro-GPU
FARLABS_VRAM_GB=16
FARLABS_BANDWIDTH_GBPS=1
FARLABS_LOCATION=US-California

# Real Inference Configuration
FARLABS_EXECUTOR=huggingface
FARLABS_EXECUTOR_DEVICE=mps
FARLABS_EXECUTOR_DTYPE=float16
FARLABS_MODEL_CACHE_DIR=$HOME/.cache/farlabs-models

# Model Mapping (Far Labs model IDs → HuggingFace repos)
FARLABS_EXECUTOR_MODEL_MAP='{"gpt2":"gpt2","llama-7b":"meta-llama/Llama-2-7b-hf","mistral-7b":"mistralai/Mistral-7B-v0.1"}'

# Enable token refresh
FARLABS_AUTH_REFRESH_ENABLED=true

# Performance Settings
FARLABS_HEARTBEAT_INTERVAL=30
FARLABS_QUEUE_NAME=inference_queue
EOF
```

**Key Settings for Mac M1:**
- `FARLABS_EXECUTOR=huggingface` - Use real AI models
- `FARLABS_EXECUTOR_DEVICE=mps` - Apple Metal Performance Shaders (GPU acceleration)
- `FARLABS_EXECUTOR_DTYPE=float16` - Half precision (faster on Apple Silicon)

### Step 3: Start Production Worker

```bash
python -m farlabs_gpu_worker run --env-file .env.production
```

The first time you run this, it will download the models (can take 5-30 minutes depending on model size).

---

## Model Recommendations for Mac M1

### For M1/M2 with 8GB RAM (Base Models)
```json
{
  "gpt2": "gpt2",
  "distilgpt2": "distilgpt2",
  "phi-2": "microsoft/phi-2"
}
```

### For M1 Pro/Max with 16-32GB RAM
```json
{
  "gpt2": "gpt2",
  "llama-7b": "meta-llama/Llama-2-7b-chat-hf",
  "mistral-7b": "mistralai/Mistral-7B-Instruct-v0.2",
  "phi-2": "microsoft/phi-2"
}
```

### For M1 Ultra/M2 Ultra with 64GB+ RAM
```json
{
  "llama-13b": "meta-llama/Llama-2-13b-chat-hf",
  "mistral-7b": "mistralai/Mistral-7B-Instruct-v0.2",
  "codellama-13b": "codellama/CodeLlama-13b-hf"
}
```

**Note:** Larger models (70B+) are not recommended for Mac M1 due to memory constraints.

---

## Monitoring Your GPU Node

### Check Your Node Status

```bash
# Get a fresh token
export FAR_TOKEN=$(curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d "{\"wallet_address\":\"$YOUR_WALLET\",\"session_tag\":\"monitoring\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# List all GPU nodes (find yours)
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/gpu/nodes' \
  | python3 -m json.tool
```

Look for your node with your `FARLABS_WALLET_ADDRESS` to see:
- `status`: "available" (ready for tasks) or "busy" (processing)
- `score`: Your reliability score (0-100)
- `tasks_completed`: Number of tasks you've processed
- `uptime_seconds`: How long your node has been running
- `last_heartbeat`: When you last checked in

### Monitor Earnings

```bash
# Check your wallet balance
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/payments/balances' \
  | python3 -m json.tool
```

### View Transaction History

```bash
# See your payment history
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/payments/history' \
  | python3 -m json.tool
```

---

## Running Your Worker 24/7

### Option 1: Keep Terminal Open

Simply leave the terminal window open with the worker running. **Not recommended** for long-term use.

### Option 2: Use `screen` or `tmux`

```bash
# Install screen (if not already installed)
brew install screen

# Start a screen session
screen -S farlabs-worker

# Start your worker
cd "/Volumes/PRO-G40/Development/Far Labs Codebase/backend/services/gpu_worker_client"
source .venv/bin/activate
python -m farlabs_gpu_worker run --env-file .env.production

# Detach from screen: Press Ctrl+A, then D
# Your worker keeps running in the background!

# To reattach later:
screen -r farlabs-worker
```

### Option 3: Use `nohup`

```bash
cd "/Volumes/PRO-G40/Development/Far Labs Codebase/backend/services/gpu_worker_client"
source .venv/bin/activate

nohup python -m farlabs_gpu_worker run --env-file .env.production > worker.log 2>&1 &

# View logs
tail -f worker.log

# To stop the worker later, find the process:
ps aux | grep farlabs_gpu_worker
kill <PID>
```

### Option 4: Create a LaunchAgent (Auto-start on Login)

```bash
# Create a plist file
cat > ~/Library/LaunchAgents/com.farlabs.gpu-worker.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.farlabs.gpu-worker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Volumes/PRO-G40/Development/Far Labs Codebase/backend/services/gpu_worker_client/.venv/bin/python</string>
        <string>-m</string>
        <string>farlabs_gpu_worker</string>
        <string>run</string>
        <string>--env-file</string>
        <string>/Volumes/PRO-G40/Development/Far Labs Codebase/backend/services/gpu_worker_client/.env.production</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Volumes/PRO-G40/Development/Far Labs Codebase/backend/services/gpu_worker_client</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/farlabs-worker-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/farlabs-worker-stderr.log</string>
</dict>
</plist>
EOF

# Load the service
launchctl load ~/Library/LaunchAgents/com.farlabs.gpu-worker.plist

# Check status
launchctl list | grep farlabs

# View logs
tail -f /tmp/farlabs-worker-stdout.log

# To stop the service:
launchctl unload ~/Library/LaunchAgents/com.farlabs.gpu-worker.plist
```

---

## Troubleshooting

### Issue: "Token expired" errors

**Solution:** Your JWT token expires after 2 hours. Enable auto-refresh:

```bash
# Add to your .env file
FARLABS_AUTH_REFRESH_ENABLED=true
FARLABS_AUTH_REFRESH_LEEWAY_SECONDS=300
```

Or get a fresh token:
```bash
export FAR_TOKEN=$(curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d "{\"wallet_address\":\"$YOUR_WALLET\",\"session_tag\":\"gpu-worker\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
```

### Issue: "Cannot connect to Redis"

**Solution:** The production Redis is on AWS. Make sure the URL is correct:
```bash
FARLABS_REDIS_URL=redis://farlabs-redis-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:6379
```

If you're testing locally, you can run your own Redis:
```bash
brew install redis
brew services start redis
# Then use: FARLABS_REDIS_URL=redis://localhost:6379
```

### Issue: "MPS device not available"

**Solution:** Make sure you're using `device=mps` (not `cuda`):
```bash
FARLABS_EXECUTOR_DEVICE=mps
```

Test MPS availability:
```python
python3 -c "import torch; print('MPS Available:', torch.backends.mps.is_available())"
```

### Issue: Model download is very slow

**Solution:** Large models take time. Start with smaller models:
```bash
# Use smaller models first
FARLABS_EXECUTOR_MODEL_MAP='{"gpt2":"gpt2","phi-2":"microsoft/phi-2"}'
```

Monitor download progress in the worker logs.

### Issue: Out of memory errors

**Solution:** Your model is too large for your Mac's RAM. Use smaller models:
- M1 8GB: Use `gpt2`, `distilgpt2`, `phi-2` (2-3B params)
- M1 16GB: Use up to 7B parameter models
- M1 32GB+: Use up to 13B parameter models

Also try reducing precision:
```bash
FARLABS_EXECUTOR_DTYPE=float16  # or int8 for even more savings
```

### Issue: Worker not receiving tasks

**Solution:** Make sure:
1. Your worker is sending heartbeats (check logs)
2. Your node status is "available" (not "busy" or "offline")
3. There are active inference requests on the platform

Check your node status:
```bash
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/gpu/nodes' \
  | python3 -m json.tool | grep -A 10 "$YOUR_WALLET"
```

---

## Performance Tips for Mac M1

### 1. Enable Metal Performance Shaders
```bash
FARLABS_EXECUTOR_DEVICE=mps  # Use Apple's GPU acceleration
```

### 2. Use Half Precision (FP16)
```bash
FARLABS_EXECUTOR_DTYPE=float16  # 2x faster, half the memory
```

### 3. Optimize Model Cache
```bash
# Store models on fast SSD
FARLABS_MODEL_CACHE_DIR=$HOME/.cache/farlabs-models
```

### 4. Monitor Temperature
Mac M1 chips throttle when hot. Keep your Mac cool:
- Use in a well-ventilated area
- Consider a laptop cooling pad
- Monitor Activity Monitor for thermal pressure

### 5. Close Other Apps
Free up RAM for inference:
```bash
# Check available memory
vm_stat | perl -ne '/page size of (\d+)/ and $size=$1; /Pages\s+([^:]+)[^\d]+(\d+)/ and printf("%16s % 16.2f Mi\n", "$1:", $2 * $size / 1048576);'
```

---

## Security Best Practices

### 1. Keep Your Private Keys Safe
Never put your actual wallet private key in the `.env` file. Only use the public wallet address.

### 2. Use Environment Variables for Sensitive Data
```bash
export FARLABS_API_TOKEN="your-token-here"
# Don't commit .env files with tokens to git
```

### 3. Enable Token Auto-Refresh
```bash
FARLABS_AUTH_REFRESH_ENABLED=true
```

### 4. Monitor Your Node
Regularly check your node status and earnings to detect any issues.

### 5. Keep Software Updated
```bash
# Update dependencies regularly
source .venv/bin/activate
pip install --upgrade -r requirements.txt
```

---

## Earning Potential

Your earnings depend on:
- **Uptime**: Keep your worker running 24/7
- **Performance**: Faster inference = more tasks
- **Reliability**: Higher score = more task assignments
- **Hardware**: Better GPU = more capable of handling larger models

**Estimated Earnings** (based on network activity):
- **Mock Executor**: $0-5/day (testing only)
- **Real Inference (small models)**: $10-50/day
- **Real Inference (large models)**: $50-200+/day

*Actual earnings vary based on network demand and your hardware specs.*

---

## Getting Help

- **Check Logs**: `tail -f worker.log` or view stdout from your terminal
- **API Status**: Visit http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
- **GPU Nodes Dashboard**: Check the frontend at `/gpu` for network stats

---

## Next Steps

1. ✅ Start with mock mode to test the connection
2. ✅ Verify your node appears in the GPU nodes list
3. ✅ Upgrade to HuggingFace executor for real inference
4. ✅ Monitor your earnings and performance
5. ✅ Optimize for 24/7 operation

**Ready to start earning?** Follow the Quick Start guide above!

---

## Quick Reference

```bash
# Navigate to worker
cd "/Volumes/PRO-G40/Development/Far Labs Codebase/backend/services/gpu_worker_client"

# Activate environment
source .venv/bin/activate

# Start worker (mock mode for testing)
python -m farlabs_gpu_worker run --env-file .env.local

# Start worker (production with real AI)
python -m farlabs_gpu_worker run --env-file .env.production

# Check node status
curl -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/gpu/nodes' | python3 -m json.tool

# Check earnings
curl -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/payments/balances' | python3 -m json.tool
```

---

**Happy Mining!** 🚀

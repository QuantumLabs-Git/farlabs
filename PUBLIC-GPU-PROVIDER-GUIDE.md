# Become a Far Labs GPU Provider - Earn $FAR Tokens

Turn your Mac M1/M2/M3 into a GPU provider and earn $FAR tokens by providing compute power for AI inference tasks on the Far Labs decentralized network.

## 💰 Why Become a GPU Provider?

- **Earn Passive Income**: Get paid in $FAR tokens for processing AI inference tasks
- **Flexible Schedule**: Run your node whenever you want - hourly, daily, or 24/7
- **Easy Setup**: Simple installation process, works on any Mac with Apple Silicon
- **Low Barrier to Entry**: No expensive NVIDIA GPUs needed - use your existing Mac M1/M2/M3
- **Help Decentralize AI**: Support the democratization of AI infrastructure

## 📊 Potential Earnings

Your earnings depend on:
- **Uptime**: How long your node runs (24/7 earns more)
- **Model Capability**: Larger models = higher payouts
- **Network Demand**: More users = more tasks = more earnings
- **Performance Score**: Higher reliability = priority task assignment

**Estimated Monthly Income:**
- **M1 8GB (Base)**: $50-150/month running small models part-time
- **M1 Pro/Max 16-32GB**: $200-500/month running medium models
- **M1 Ultra 64GB+**: $500-1500/month running large models 24/7

*Earnings vary based on network activity and your hardware specifications*

---

## ✅ System Requirements

### Hardware
- Mac with Apple Silicon (M1, M1 Pro, M1 Max, M1 Ultra, M2, M2 Pro, M2 Max, M2 Ultra, M3, M3 Pro, M3 Max)
- Minimum 8GB RAM (16GB+ recommended for better earnings)
- 20GB+ free disk space (for AI model storage)
- Stable internet connection (10 Mbps+ upload recommended)

### Software
- macOS 12.0 (Monterey) or later
- Python 3.9 or later (pre-installed on modern macOS)
- Terminal access (built into macOS)

### Account
- Crypto wallet address (MetaMask, Trust Wallet, etc.)
  - Don't have one? Get MetaMask: https://metamask.io

---

## 🚀 Quick Start Guide (10 Minutes)

### Step 1: Download the GPU Worker

Open Terminal (⌘ + Space, type "Terminal") and run:

```bash
# Create directory for Far Labs
mkdir -p ~/FarLabs
cd ~/FarLabs

# Download the GPU worker from GitHub
git clone https://github.com/QuantumLabs-Git/farlabs.git
cd farlabs/backend/services/gpu_worker_client
```

**Don't have git?** Install it:
```bash
xcode-select --install
```

Or download directly from the web:
1. Visit: https://github.com/QuantumLabs-Git/farlabs
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file
4. Open Terminal and navigate to: `farlabs-main/backend/services/gpu_worker_client`

### Step 2: Install Dependencies

```bash
# Create Python virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

This will install:
- HTTP client for API communication
- Redis client for task queuing
- PyTorch with Apple Silicon support (optional, for real inference)
- Transformers for AI models (optional)

### Step 3: Get Your Wallet Address

You need a BSC (Binance Smart Chain) compatible wallet address where you'll receive $FAR token payments.

**If you already have MetaMask:**
1. Open MetaMask
2. Copy your wallet address (starts with `0x`)

**If you don't have a wallet:**
1. Install MetaMask: https://metamask.io
2. Create a new wallet
3. **IMPORTANT**: Save your seed phrase securely!
4. Copy your wallet address

### Step 4: Get Authentication Token

Run this command (replace `YOUR_WALLET_ADDRESS` with your actual wallet):

```bash
export YOUR_WALLET="0xYourWalletAddressHere"

curl -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d "{\"wallet_address\":\"$YOUR_WALLET\",\"session_tag\":\"gpu-provider\"}"
```

**Copy the token** from the response (the long string after `"token":`).

### Step 5: Configure Your Worker

Create a configuration file:

```bash
cat > config.env << 'EOF'
# Far Labs GPU Worker Configuration

# API Endpoint (Production)
FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com

# Your authentication token (replace with token from Step 4)
FARLABS_API_TOKEN=paste_your_token_here

# Redis connection
FARLABS_REDIS_URL=redis://farlabs-redis-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:6379

# Your wallet address (where you receive payments)
FARLABS_WALLET_ADDRESS=0xYourWalletAddressHere

# Hardware Profile (auto-detected, but you can customize)
FARLABS_GPU_MODEL=Apple-M1-GPU
FARLABS_VRAM_GB=8
FARLABS_BANDWIDTH_GBPS=1
FARLABS_LOCATION=US-California

# Execution Mode
FARLABS_EXECUTOR=mock

# Enable auto token refresh (recommended)
FARLABS_AUTH_REFRESH_ENABLED=true
FARLABS_HEARTBEAT_INTERVAL=30
EOF
```

**Edit the file** to add your token and wallet:
```bash
nano config.env
```

Update these lines:
- `FARLABS_API_TOKEN=` - Paste your token from Step 4
- `FARLABS_WALLET_ADDRESS=` - Your wallet address
- `FARLABS_GPU_MODEL=` - Your chip (Apple-M1-GPU, Apple-M2-GPU, etc.)
- `FARLABS_VRAM_GB=` - Your RAM (8, 16, 32, 64, etc.)
- `FARLABS_LOCATION=` - Your location (e.g., "US-California", "UK-London")

Press Ctrl+X, then Y, then Enter to save.

### Step 6: Start Your Worker!

```bash
# Make sure you're in the right directory
cd ~/FarLabs/farlabs/backend/services/gpu_worker_client

# Activate Python environment
source .venv/bin/activate

# Start the worker
python -m farlabs_gpu_worker run --env-file config.env
```

**You should see:**
```
[INFO] Far Labs GPU Worker starting...
[INFO] Wallet: 0xYourAddress
[INFO] GPU Model: Apple-M1-GPU
[INFO] Registering GPU node...
[INFO] ✓ Registered as node_xyz123
[INFO] ✓ Heartbeat sent (uptime: 0s, score: 100.0)
[INFO] Listening for tasks...
```

🎉 **Congratulations!** You're now a Far Labs GPU provider!

---

## 💪 Upgrade to Real AI Inference (Earn More!)

The basic setup uses "mock" mode for testing. To process **real AI models** and maximize earnings:

### Install PyTorch for Apple Silicon

```bash
# Activate your environment
source .venv/bin/activate

# Install AI packages
pip install torch torchvision torchaudio transformers accelerate
```

### Update Configuration

Edit your config:
```bash
nano config.env
```

Change `FARLABS_EXECUTOR=mock` to:
```bash
# Real AI inference settings
FARLABS_EXECUTOR=huggingface
FARLABS_EXECUTOR_DEVICE=mps
FARLABS_EXECUTOR_DTYPE=float16
FARLABS_MODEL_CACHE_DIR=$HOME/.cache/farlabs-models

# Model mapping (recommended for Mac M1)
FARLABS_EXECUTOR_MODEL_MAP={"gpt2":"gpt2","phi-2":"microsoft/phi-2"}
```

**Model Recommendations by Hardware:**

**M1/M2 with 8GB RAM:**
```json
{"gpt2":"gpt2","phi-2":"microsoft/phi-2"}
```

**M1 Pro/Max with 16-32GB RAM:**
```json
{"gpt2":"gpt2","llama-7b":"meta-llama/Llama-2-7b-chat-hf","mistral-7b":"mistralai/Mistral-7B-Instruct-v0.2"}
```

**M1 Ultra with 64GB+ RAM:**
```json
{"llama-13b":"meta-llama/Llama-2-13b-chat-hf","codellama-13b":"codellama/CodeLlama-13b-hf"}
```

### Restart Worker

```bash
python -m farlabs_gpu_worker run --env-file config.env
```

**First run will download models** (5-30 minutes depending on size).

---

## 📱 Monitor Your Earnings

### Check Your Node Status

```bash
# Get a fresh token first
export FAR_TOKEN=$(curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d "{\"wallet_address\":\"$YOUR_WALLET\",\"session_tag\":\"monitoring\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# View all GPU nodes (find yours by wallet address)
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/gpu/nodes' \
  | python3 -m json.tool
```

Look for:
- `status`: "available" (ready for work) or "busy" (processing)
- `score`: Your reliability rating (0-100)
- `tasks_completed`: How many tasks you've processed
- `uptime_seconds`: How long you've been online

### Check Your Balance

```bash
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/payments/balances' \
  | python3 -m json.tool
```

### View Transaction History

```bash
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/payments/history' \
  | python3 -m json.tool
```

### Web Dashboard

Visit the Far Labs dashboard to see your stats visually:
```
http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/dashboard
```

---

## 🔄 Running 24/7 (Maximize Earnings)

### Option 1: Use `screen` (Recommended)

```bash
# Install screen
brew install screen

# Start a screen session
screen -S farlabs

# Start your worker
cd ~/FarLabs/farlabs/backend/services/gpu_worker_client
source .venv/bin/activate
python -m farlabs_gpu_worker run --env-file config.env

# Detach: Press Ctrl+A, then D
# Your worker keeps running!

# Reattach later:
screen -r farlabs
```

### Option 2: Use `nohup`

```bash
cd ~/FarLabs/farlabs/backend/services/gpu_worker_client
source .venv/bin/activate

nohup python -m farlabs_gpu_worker run --env-file config.env > worker.log 2>&1 &

# View logs
tail -f worker.log

# Stop worker later
ps aux | grep farlabs_gpu_worker
kill <PID>
```

### Option 3: Auto-Start on Login

Create a LaunchAgent:

```bash
# Create plist file
cat > ~/Library/LaunchAgents/com.farlabs.gpu-worker.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.farlabs.gpu-worker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/YOUR_USERNAME/FarLabs/farlabs/backend/services/gpu_worker_client/.venv/bin/python</string>
        <string>-m</string>
        <string>farlabs_gpu_worker</string>
        <string>run</string>
        <string>--env-file</string>
        <string>/Users/YOUR_USERNAME/FarLabs/farlabs/backend/services/gpu_worker_client/config.env</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/FarLabs/farlabs/backend/services/gpu_worker_client</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/farlabs-worker.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/farlabs-worker-error.log</string>
</dict>
</plist>
EOF

# Replace YOUR_USERNAME with your actual username
sed -i '' "s/YOUR_USERNAME/$USER/g" ~/Library/LaunchAgents/com.farlabs.gpu-worker.plist

# Load the service
launchctl load ~/Library/LaunchAgents/com.farlabs.gpu-worker.plist

# View logs
tail -f /tmp/farlabs-worker.log
```

---

## ⚠️ Troubleshooting

### "Token expired" error

Your token expires after 2 hours. Get a new one:

```bash
export YOUR_WALLET="0xYourWalletAddress"

export NEW_TOKEN=$(curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d "{\"wallet_address\":\"$YOUR_WALLET\",\"session_tag\":\"gpu-provider\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo $NEW_TOKEN
```

Update your `config.env` with the new token, or enable auto-refresh:
```bash
FARLABS_AUTH_REFRESH_ENABLED=true
```

### "Cannot connect to Redis" error

Make sure the Redis URL in your `config.env` is correct:
```bash
FARLABS_REDIS_URL=redis://farlabs-redis-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:6379
```

### "MPS device not available" error

Use `mps` device for Apple Silicon:
```bash
FARLABS_EXECUTOR_DEVICE=mps
```

Test MPS:
```bash
python3 -c "import torch; print('MPS Available:', torch.backends.mps.is_available())"
```

### Out of memory errors

Your model is too large. Use smaller models:

For 8GB Macs:
```bash
FARLABS_EXECUTOR_MODEL_MAP={"gpt2":"gpt2"}
```

Also try half precision:
```bash
FARLABS_EXECUTOR_DTYPE=float16
```

### Worker not receiving tasks

Check your node is online and available:

```bash
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/gpu/nodes' \
  | python3 -m json.tool | grep -A 10 "$YOUR_WALLET"
```

Make sure:
- `status` is "available" (not "offline" or "busy")
- Heartbeats are recent (within last minute)
- Your worker is still running

---

## 🔒 Security Best Practices

### 1. Protect Your Wallet
- Never share your private key or seed phrase
- Only put your **public wallet address** in the config
- Use a dedicated wallet for GPU mining

### 2. Keep Software Updated
```bash
cd ~/FarLabs/far-gpu-worker
git pull
source .venv/bin/activate
pip install --upgrade -r requirements.txt
```

### 3. Monitor Your Node
- Check your earnings regularly
- Watch for unusual activity
- Keep your Mac software updated

### 4. Secure Your Config
```bash
# Don't let others read your config
chmod 600 config.env
```

---

## 💡 Performance Tips

### Maximize Earnings
1. **Run 24/7**: More uptime = more tasks = more earnings
2. **Keep Cool**: Hot Macs throttle performance
3. **Fast Internet**: Faster uploads = quicker task completion
4. **Larger Models**: If you have RAM, run bigger models for higher payouts
5. **High Score**: Maintain 100% reliability for priority task assignment

### Optimize Power Usage
```bash
# Check power settings
pmset -g

# Prevent sleep while running (in separate terminal)
caffeinate -i python -m farlabs_gpu_worker run --env-file config.env
```

### Monitor Performance
```bash
# Check CPU/GPU usage
top -l 1 | grep -E "^CPU|^PhysMem"

# Check temperature (install if needed: brew install osx-cpu-temp)
osx-cpu-temp
```

---

## 🎓 Understanding the Network

### How It Works

1. **Users submit AI tasks** through the Far Labs platform
2. **Platform assigns tasks** to available GPU nodes (like yours)
3. **Your worker processes** the AI inference using your Mac's GPU
4. **Results stream back** to the user in real-time
5. **You get paid** in $FAR tokens based on compute provided

### Payment Model

- **Per-task payment**: Fixed amount per completed task
- **Model-based multiplier**: Larger models = higher payout
- **Performance bonus**: Higher uptime/score = bonus multiplier
- **Automatic payouts**: Earnings credited to your wallet instantly

### Network Stats

Check global network statistics:
```bash
curl -s 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/gpu/nodes' | python3 -m json.tool
```

Visit the dashboard:
```
http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
```

---

## 📞 Support & Community

### Need Help?

- **Technical Issues**: Check the Troubleshooting section above
- **Questions**: Visit http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/docs
- **GitHub**: https://github.com/farlabs/far-gpu-worker
- **Discord**: Join our community (link on website)

### Share Your Success

Earning well? Share your experience:
- Post your setup and earnings on social media
- Tag #FarLabs #GPUMining #M1Mining
- Help other providers get started

---

## 🚀 Next Steps

1. ✅ Complete the Quick Start guide
2. ✅ Verify your node is online
3. ✅ Process your first task
4. ✅ Upgrade to real AI inference
5. ✅ Set up 24/7 operation
6. ✅ Join the community
7. ✅ Optimize for maximum earnings

---

## 📊 Quick Reference

```bash
# Navigate to worker
cd ~/FarLabs/farlabs/backend/services/gpu_worker_client

# Activate environment
source .venv/bin/activate

# Start worker
python -m farlabs_gpu_worker run --env-file config.env

# Check status
curl -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/gpu/nodes'

# Check earnings
curl -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/payments/balances'

# Update worker
cd ~/FarLabs/farlabs && git pull && cd backend/services/gpu_worker_client && pip install --upgrade -r requirements.txt

# View logs (if using screen)
screen -r farlabs

# View logs (if using nohup)
tail -f worker.log
```

---

**Ready to start earning $FAR tokens with your Mac?** Follow the Quick Start guide above! 🚀💰

---

*This guide is maintained by the Far Labs team. Last updated: 2025*
*Far Labs Platform: http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com*

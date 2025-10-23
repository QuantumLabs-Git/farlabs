# Start Earning $FAR with Your Mac M1/M2/M3

Turn your Mac into a GPU provider and earn passive income by processing AI tasks for the Far Labs network.

## Requirements
- Mac with Apple Silicon (M1/M2/M3)
- 8GB+ RAM
- macOS 12.0+
- Crypto wallet (MetaMask)

## Quick Start (5 Minutes)

### 1. Download the Worker
```bash
mkdir -p ~/FarLabs && cd ~/FarLabs
git clone https://github.com/QuantumLabs-Git/farlabs.git
cd farlabs/backend/services/gpu_worker_client
```

### 2. Install
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure
Replace `YOUR_WALLET_ADDRESS` with your actual wallet:

```bash
cat > config.env << 'EOF'
FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
FARLABS_REDIS_URL=redis://farlabs-redis-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:6379
FARLABS_WALLET_ADDRESS=YOUR_WALLET_ADDRESS
FARLABS_GPU_MODEL=Apple-M1-GPU
FARLABS_VRAM_GB=8
FARLABS_LOCATION=US-California
FARLABS_EXECUTOR=mock
FARLABS_AUTH_REFRESH_ENABLED=true
EOF
```

Edit the file to add your wallet address:
```bash
nano config.env
```

### 4. Get Auth Token
```bash
export YOUR_WALLET="0xYourWalletAddress"

curl -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d "{\"wallet_address\":\"$YOUR_WALLET\",\"session_tag\":\"gpu-provider\"}"
```

Copy the token from the response and add it to `config.env`:
```bash
nano config.env
# Update: FARLABS_API_TOKEN=paste_token_here
```

### 5. Start Earning!
```bash
python -m farlabs_gpu_worker run --env-file config.env
```

You should see:
```
[INFO] ✓ Registered as node_xyz123
[INFO] ✓ Heartbeat sent
[INFO] Listening for tasks...
```

🎉 **Done!** You're now earning $FAR tokens!

---

## Check Your Earnings

```bash
# Get fresh token
export FAR_TOKEN=$(curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d "{\"wallet_address\":\"$YOUR_WALLET\",\"session_tag\":\"check\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Check your balance
curl -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/payments/balances'
```

---

## Run 24/7 (Optional)

Use `screen` to keep running:
```bash
screen -S farlabs
cd ~/FarLabs/farlabs/backend/services/gpu_worker_client
source .venv/bin/activate
python -m farlabs_gpu_worker run --env-file config.env

# Detach: Press Ctrl+A then D
# Reattach later: screen -r farlabs
```

---

## Upgrade to Real AI (Earn More!)

```bash
# Install AI packages
source .venv/bin/activate
pip install torch torchvision torchaudio transformers accelerate
```

Update `config.env`:
```bash
FARLABS_EXECUTOR=huggingface
FARLABS_EXECUTOR_DEVICE=mps
FARLABS_EXECUTOR_DTYPE=float16
FARLABS_EXECUTOR_MODEL_MAP={"gpt2":"gpt2","phi-2":"microsoft/phi-2"}
```

Restart worker.

---

## Estimated Earnings

- **M1 8GB**: $50-150/month (part-time)
- **M1 Pro 16GB**: $200-500/month
- **M1 Ultra 64GB**: $500-1500+/month

*Depends on uptime and network demand*

---

## Need Help?

- **Full Guide**: `PUBLIC-GPU-PROVIDER-GUIDE.md`
- **Frontend**: http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
- **GitHub**: https://github.com/QuantumLabs-Git/farlabs

---

**Start earning today!** 🚀💰

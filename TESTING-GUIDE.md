# Far Labs Platform Testing Guide - Mac M1

This guide will walk you through testing the Far Labs platform on your Mac M1.

## Prerequisites

You already have everything you need:
- Mac M1 with Terminal
- `curl` (pre-installed on macOS)
- `jq` (optional, for pretty JSON formatting)
- AWS CLI (already configured)

## Quick Setup

```bash
# Optional: Install jq for better JSON formatting
brew install jq

# Navigate to the project directory
cd "/Volumes/PRO-G40/Development/Far Labs Codebase"
```

## Test Method 1: Production Deployment (Recommended - Easiest)

Your platform is already deployed and running on AWS! Let's test it.

### Step 1: Test the Frontend

Open your browser and visit:
```
http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
```

You should see the Far Labs homepage with:
- Navigation menu (Overview, Dashboard, Inference, Gaming, DeSci, Staking, Docs)
- "Build, stake, and scale with the Far Labs protocol suite" header
- Six platform cards (Far Inference, Farcana Game, Far DeSci, etc.)

### Step 2: Test Authentication API

```bash
# Get a JWT token
curl -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"wallet_address":"0x0000000000000000000000000000000000000001","session_tag":"test"}' \
  | jq '.'
```

**Expected Output:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "wallet_address": "0x0000000000000000000000000000000000000001",
  "expires_in": 7200,
  "session_tag": "test"
}
```

### Step 3: Test GPU Nodes API

First, save your token:
```bash
# Get and save token
export FAR_TOKEN=$(curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"wallet_address":"0x0000000000000000000000000000000000000001","session_tag":"test"}' \
  | jq -r '.token')

# Verify token was saved
echo "Token: ${FAR_TOKEN:0:50}..."
```

Now test the GPU nodes endpoint:
```bash
# List all registered GPU nodes
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/gpu/nodes' \
  | jq '.'
```

**Expected Output:**
You should see 5 registered nodes with details like:
```json
{
  "nodes": [
    {
      "node_id": "node_c3d7cbbb3a",
      "wallet_address": "0x0000000000000000000000000000000000000001",
      "gpu_model": "CPU - HuggingFace Transformers",
      "vram_gb": 16,
      "status": "available",
      "score": 100.0,
      "last_heartbeat": "2025-10-23T13:17:00.184817+00:00"
    }
    // ... more nodes
  ]
}
```

### Step 4: Test Payments/Balance API

```bash
# Check your wallet balance
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/payments/balances' \
  | jq '.'
```

### Step 5: Test Staking API

```bash
# Check staking positions
curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/staking/positions' \
  | jq '.'
```

### Step 6: Test Inference Submission

```bash
# Submit a simple inference task
curl -s -X POST -H "Authorization: Bearer $FAR_TOKEN" \
  -H 'Content-Type: application/json' \
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/inference/tasks' \
  -d '{
    "model": "gpt2",
    "prompt": "Hello, this is a test",
    "max_tokens": 50
  }' \
  | jq '.'
```

**Expected Output:**
```json
{
  "task_id": "task_abc123...",
  "status": "pending",
  "created_at": "2025-10-23T..."
}
```

### Step 7: Check Task Status

```bash
# Replace TASK_ID with the task_id from above
TASK_ID="task_abc123..."

curl -s -H "Authorization: Bearer $FAR_TOKEN" \
  "http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/inference/tasks/$TASK_ID" \
  | jq '.'
```

---

## Test Method 2: Local Development Setup

If you want to run the platform locally on your Mac M1:

### Step 1: Install Docker Desktop for Mac

Download from: https://www.docker.com/products/docker-desktop/

Make sure to select the **Apple Silicon (M1/M2/M3)** version.

### Step 2: Check Docker Installation

```bash
docker --version
docker info
```

### Step 3: Start Local Services with Docker Compose

```bash
cd "/Volumes/PRO-G40/Development/Far Labs Codebase"

# Start all services
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Test Local Endpoints

Once services are running locally:

```bash
# Frontend
open http://localhost:3000

# API Gateway
curl http://localhost:8000/healthz

# Auth Service
curl -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"wallet_address":"0x0000000000000000000000000000000000000001","session_tag":"local-test"}'
```

---

## Test Method 3: Frontend Development Mode

Test the Next.js frontend locally:

### Step 1: Install Dependencies

```bash
cd "/Volumes/PRO-G40/Development/Far Labs Codebase/frontend"

# Install Node.js dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Create .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api
NEXT_PUBLIC_WS_URL=ws://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
EOF
```

### Step 3: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Step 4: Test Frontend Features

1. **Connect Wallet** - Click "Connect" button (requires MetaMask or compatible wallet)
2. **Dashboard** - Navigate to /dashboard to see your stats
3. **Inference Playground** - Navigate to /inference to test AI inference
4. **Staking** - Navigate to /staking to see staking interface
5. **GPU Nodes** - Navigate to /gpu to see registered GPU nodes

---

## Complete Testing Checklist

### Backend API Tests ✓

- [ ] Authentication works (login endpoint returns JWT)
- [ ] GPU nodes list returns data
- [ ] Payments/balances endpoint responds
- [ ] Staking positions endpoint responds
- [ ] Inference task submission works
- [ ] Task status checking works

### Frontend Tests ✓

- [ ] Homepage loads correctly
- [ ] Navigation menu works
- [ ] Dashboard page displays
- [ ] Inference page loads
- [ ] Staking page loads
- [ ] GPU page loads
- [ ] Wallet connection interface works

### Integration Tests ✓

- [ ] Frontend can authenticate with backend
- [ ] Frontend can fetch GPU nodes
- [ ] Frontend can submit inference tasks
- [ ] Frontend displays real-time data

### AWS Infrastructure Tests ✓

- [ ] All ECS services running (9 services)
- [ ] Load balancer routing correctly
- [ ] Health checks passing
- [ ] Redis connection working

---

## Monitoring Your Deployment

### Check Service Status

```bash
# List all ECS services
aws ecs list-services --cluster farlabs-cluster-free --region us-east-1

# Check specific service details
aws ecs describe-services \
  --cluster farlabs-cluster-free \
  --services farlabs-api-free farlabs-inference-free \
  --region us-east-1
```

### View Service Logs

```bash
# API Gateway logs
aws logs tail /ecs/farlabs-api-gateway-free --since 10m --follow --region us-east-1

# Inference Service logs
aws logs tail /ecs/farlabs-inference-free --since 10m --follow --region us-east-1

# GPU Service logs
aws logs tail /ecs/farlabs-gpu-free --since 10m --follow --region us-east-1

# Frontend logs
aws logs tail /ecs/farlabs-frontend-free --since 10m --follow --region us-east-1
```

### Check GPU Worker Activity

```bash
# See active GPU workers
aws ecs list-tasks --cluster farlabs-cluster-free --service-name farlabs-gpu-worker-free --region us-east-1

# View GPU worker logs
aws logs tail /ecs/farlabs-gpu-worker-free --since 5m --follow --region us-east-1
```

---

## Troubleshooting

### Issue: "Connection refused" errors

**Solution:** Check if services are running:
```bash
aws ecs describe-services --cluster farlabs-cluster-free --services farlabs-api-free --region us-east-1
```

### Issue: "Authorization failed" errors

**Solution:** Get a fresh JWT token:
```bash
export FAR_TOKEN=$(curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"wallet_address":"0x0000000000000000000000000000000000000001","session_tag":"test"}' \
  | jq -r '.token')
```

### Issue: Frontend not loading

**Solution:** Check frontend service:
```bash
aws ecs describe-services --cluster farlabs-cluster-free --services farlabs-frontend-free --region us-east-1
aws logs tail /ecs/farlabs-frontend-free --since 5m --region us-east-1
```

### Issue: Docker not working on Mac

**Solution:**
1. Make sure Docker Desktop is installed and running
2. Open Docker Desktop app
3. Wait for it to fully start (green icon in menu bar)
4. Try `docker ps` to verify

---

## Performance Testing

### Load Testing with curl

```bash
# Test authentication performance (10 requests)
for i in {1..10}; do
  time curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
    -H 'Content-Type: application/json' \
    -d '{"wallet_address":"0x0000000000000000000000000000000000000001","session_tag":"test"}' \
    > /dev/null
done
```

### Concurrent Request Testing

```bash
# Install Apache Bench (if needed)
brew install httpd

# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/
```

---

## Next Steps

1. **Test the production deployment first** (Method 1) - easiest and fastest
2. **If you need to modify code**, set up local development (Method 2 or 3)
3. **Monitor logs** while testing to see what's happening behind the scenes
4. **Check the frontend** in your browser for the full user experience

## Quick Reference

**Production URL:** http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com

**API Endpoints:**
- Auth: `/api/auth/login`
- GPU Nodes: `/api/gpu/nodes`
- Payments: `/api/payments/balances`
- Staking: `/api/staking/positions`
- Inference: `/api/inference/tasks`

**Your test wallet:** `0x0000000000000000000000000000000000000001`

---

Ready to start testing? Begin with **Step 1 of Method 1** above!

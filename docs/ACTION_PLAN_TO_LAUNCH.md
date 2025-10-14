# Action Plan: Making the Whole System Work

**Status**: Implementation Roadmap
**Goal**: Get Far Labs platform + Far Mesh distributed inference fully operational
**Timeline**: 2-3 weeks for MVP, 8 weeks for full launch

---

## Current System Status

### ✅ What's Working
1. **Frontend** - Next.js app built and ready
2. **GPU Worker Client** - Successfully deployed to ECR
3. **Auth Service** - JWT authentication functional
4. **PostgreSQL Database** - RDS instance running
5. **API Gateway** - Load balancer configured

### 🚧 What's Partially Complete
1. **Far Mesh Coordinator** - Code written, not deployed
2. **Far Node Server** - Code written, not deployed
3. **Database Schema** - Migration file created, not applied
4. **Inference Service** - Currently building (should complete soon)

### ❌ What's Missing
1. **Discovery Service** - Not yet built (needed for node registry)
2. **Payment Tracker** - Not yet built (needed for provider payments)
3. **DHT Bootstrap Node** - Not deployed (needed for Petals network)
4. **Provider Dashboard UI** - Not built
5. **SDKs** - Python and TypeScript SDKs not built

---

## Critical Path to MVP (Priority Order)

### Phase 1: Get Existing Platform Working (Week 1)

#### 1.1 Apply Database Migrations ⚡ URGENT
```bash
# Apply distributed inference schema
psql -h farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com \
     -U farlabs_admin \
     -d farlabs \
     -f backend/database/migrations/004_distributed_inference.sql
```

**Why**: Far Mesh services need these tables to function
**Time**: 5 minutes
**Blockers**: None

---

#### 1.2 Fix Inference Service Build ⚡ URGENT

**Current Issue**: Frontend built ✅, but inference service still building (PyTorch takes 10-15 min)

**Action if build fails**:
```bash
# Option 1: Use pre-built PyTorch image
# Update backend/services/inference/Dockerfile:
FROM pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime

# Option 2: Increase build timeout
# In deployment script, add:
timeout=1800  # 30 minutes
```

**Why**: Users need centralized inference while distributed mesh is being set up
**Time**: Monitor build, fix if needed (30 min)
**Blockers**: Long build time

---

#### 1.3 Deploy Far Mesh Coordinator Service 🎯 HIGH PRIORITY

```bash
# 1. Create ECR repository
aws ecr create-repository \
    --repository-name farlabs-far-mesh-coordinator \
    --region us-east-1

# 2. Build and push image
cd backend/services/far_mesh_coordinator
docker build -t farlabs-far-mesh-coordinator .

aws ecr get-login-password --region us-east-1 | \
    docker login --username AWS --password-stdin \
    894059646844.dkr.ecr.us-east-1.amazonaws.com

docker tag farlabs-far-mesh-coordinator:latest \
    894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-far-mesh-coordinator:latest

docker push 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-far-mesh-coordinator:latest

# 3. Create ECS task definition
# (See detailed JSON in section below)

# 4. Update ECS service
aws ecs update-service \
    --cluster farlabs-cluster-free \
    --service far-mesh-coordinator \
    --task-definition far-mesh-coordinator:1 \
    --desired-count 1
```

**Environment Variables Needed**:
```
FAR_MESH_DHT_BOOTSTRAP=/ip4/discovery.farlabs.ai/tcp/31337
POSTGRES_URL=postgresql://farlabs_admin:FarLabs2025SecurePass!@farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:5432/farlabs
REDIS_URL=redis://farlabs-redis:6379/0
DEFAULT_MODEL_ID=meta-llama/Llama-2-7b-chat-hf
PRICE_PER_TOKEN_FAR=0.0001
LOG_LEVEL=INFO
```

**Why**: This is the core service that routes inference to distributed GPU providers
**Time**: 2-3 hours
**Blockers**: Need DHT bootstrap node (see 1.4)

---

#### 1.4 Deploy DHT Bootstrap Node 🎯 HIGH PRIORITY

**Option A: Quick Deploy (Use Existing Petals Bootstrap)**
```bash
# Connect to Petals public bootstrap temporarily
FAR_MESH_DHT_BOOTSTRAP=/ip4/petals.ml/tcp/31337/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN
```

**Option B: Deploy Our Own (Recommended)**
```bash
# 1. Launch EC2 instance
aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1f0 \  #  Ubuntu 22.04
    --instance-type t3.medium \
    --key-name farlabs-deploy-key \
    --security-group-ids sg-YOUR_SG \
    --subnet-id subnet-YOUR_SUBNET \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=far-mesh-dht-bootstrap}]'

# 2. SSH and install Hivemind
ssh -i ~/.ssh/farlabs-deploy-key.pem ubuntu@<INSTANCE_IP>

sudo apt update
sudo apt install -y python3-pip
pip3 install hivemind

# 3. Start DHT bootstrap node
python3 -m hivemind.dht.dht_daemon \
    --host 0.0.0.0 \
    --port 31337 \
    --announce_maddrs /ip4/0.0.0.0/tcp/31337

# 4. Note the Peer ID and update all configs
# Output will show: "Running DHT node with peer_id=QmYourPeerID..."
```

**Why**: Required for Petals mesh network to function
**Time**: 1 hour (Option A: 5 min, Option B: 1 hour)
**Blockers**: None for Option A

---

### Phase 2: Distributed Inference Foundation (Week 2)

#### 2.1 Build Discovery Service 🎯 HIGH PRIORITY

**What it does**:
- Registers GPU provider nodes
- Tracks node health (heartbeats)
- Provides list of active nodes for Far Mesh Coordinator

**Files to create**:
```
backend/services/far_discovery/
├── discovery_service.py   # Main service logic
├── server.py              # FastAPI app
├── requirements.txt
├── Dockerfile
└── README.md
```

**Key endpoints**:
- `POST /nodes/register` - Register new provider
- `POST /nodes/heartbeat` - Update node status (every 30s)
- `POST /nodes/unregister` - Node going offline
- `GET /nodes/active` - List healthy nodes
- `GET /models/{model_id}/nodes` - Nodes serving specific model

**Implementation time**: 1-2 days
**Deployment time**: 2 hours

---

#### 2.2 Test with 1 GPU Provider 🧪 TESTING

```bash
# 1. Launch GPU instance (for testing)
aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1f0 \
    --instance-type g5.xlarge \  # NVIDIA A10G, 24GB VRAM
    --key-name farlabs-deploy-key

# 2. SSH and setup
ssh -i ~/.ssh/farlabs-deploy-key.pem ubuntu@<GPU_INSTANCE_IP>

# 3. Install NVIDIA drivers
sudo apt update
sudo apt install -y nvidia-driver-535 nvidia-cuda-toolkit

# 4. Download Far Node Server
git clone https://github.com/farlabs/far-node-server.git
cd far-node-server

# 5. Run setup
chmod +x start-far-node.sh
./start-far-node.sh

# Follow prompts:
# - Wallet: 0xTEST_WALLET_ADDRESS
# - Model: Llama-2-7B
# - Public IP: auto

# 6. Start node
./run-far-node.sh

# Should see:
# ✓ Far Node Server is ready and earning $FAR!
# [Heartbeat] Tokens: 0 | Earned: 0 FAR | VRAM: 22.5GB
```

**Success Criteria**:
- Node registers with discovery service
- Heartbeats every 30 seconds
- Shows in `/nodes/active` endpoint
- Far Mesh Coordinator can discover it

**Time**: 3-4 hours
**Blockers**: Discovery service must be deployed first

---

#### 2.3 End-to-End Inference Test 🧪 TESTING

```bash
# Test distributed inference flow
curl -X POST http://farlabs-alb-free.us-east-1.elb.amazonaws.com/mesh/inference/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "max_tokens": 100,
    "user_wallet": "0xTEST_WALLET",
    "request_id": "test_001",
    "model_id": "meta-llama/Llama-2-7b-chat-hf"
  }'

# Should return SSE stream:
# data: {"token": "Quantum", "request_id": "test_001", "tokens_generated": 1, "cost_far": "0.0001"}
# data: {"token": " computing", "request_id": "test_001", "tokens_generated": 2, "cost_far": "0.0002"}
# ...
```

**Verify in database**:
```sql
-- Check session recorded
SELECT * FROM far_mesh_sessions WHERE request_id = 'test_001';

-- Check node contributions
SELECT * FROM far_session_contributions
WHERE session_id = (SELECT id FROM far_mesh_sessions WHERE request_id = 'test_001');
```

**Success Criteria**:
- Request completes successfully
- Tokens stream back in real-time
- Session recorded in `far_mesh_sessions` table
- Contributions recorded in `far_session_contributions` table
- Node shows token count in heartbeat

**Time**: 1-2 hours (debugging)
**Blockers**: Must have working node + discovery + coordinator

---

### Phase 3: Payment Infrastructure (Week 3)

#### 3.1 Build Payment Tracker Service 💰

**What it does**:
- Runs weekly (Monday 00:00 UTC)
- Queries unpaid contributions from database
- Groups by provider wallet
- Executes blockchain payments
- Marks contributions as paid

**Files to create**:
```
backend/services/far_payment_tracker/
├── payment_tracker.py     # Main logic
├── scheduler.py           # Cron job
├── blockchain.py          # Web3 transactions
├── requirements.txt
├── Dockerfile
└── README.md
```

**Key logic**:
```python
async def process_weekly_payments():
    # 1. Get unpaid contributions
    query = """
        SELECT
            node_id,
            wallet_address,
            SUM(payment_far) as total_far,
            COUNT(*) as session_count
        FROM far_session_contributions c
        JOIN far_nodes n ON c.node_id = n.id
        WHERE paid_at IS NULL
        GROUP BY node_id, wallet_address
        HAVING SUM(payment_far) >= 10  -- Minimum 10 FAR
    """

    # 2. Create payment batch
    batch = create_payment_batch(contributions)

    # 3. Execute blockchain transaction
    tx_hash = await send_batch_payment_bsc(batch)

    # 4. Mark as paid
    await mark_contributions_paid(batch.contribution_ids, tx_hash)
```

**Implementation time**: 2-3 days
**Deployment time**: 2 hours

---

#### 3.2 Test Payment Flow 💰🧪

```bash
# 1. Generate fake contributions
INSERT INTO far_session_contributions (
    session_id, node_id, tokens_contributed, payment_far
) VALUES
    ('<session_uuid>', '<node_uuid>', 1000, 0.1),
    ('<session_uuid>', '<node_uuid>', 1500, 0.15);

# 2. Run payment tracker manually
python3 -m payment_tracker --dry-run

# Should show:
# ✓ Found 1 provider with unpaid earnings
# ✓ Total to pay: 0.25 FAR
# ✓ Would execute payment transaction...
# [DRY RUN - no actual payment]

# 3. Run for real (on testnet first!)
python3 -m payment_tracker --network testnet

# 4. Verify payment
SELECT * FROM far_session_contributions WHERE paid_at IS NOT NULL;
SELECT * FROM far_payment_batches WHERE status = 'confirmed';
```

**Success Criteria**:
- Correctly calculates provider earnings
- Groups multiple sessions per provider
- Executes BSC transaction
- Records transaction hash
- Updates `paid_at` timestamps

**Time**: 1 day (including testnet testing)
**Blockers**: Need BSC testnet tokens and admin wallet

---

### Phase 4: Provider Experience (Weeks 3-4)

#### 4.1 Provider Dashboard UI 📊

**Location**: `frontend/src/app/provider/`

**Components to build**:
```tsx
// NodeStatus.tsx - Shows online/offline, uptime
<NodeStatus
  isOnline={true}
  uptime="3d 14h 22m"
  lastSeen={Date.now()}
/>

// EarningsChart.tsx - Earnings over time
<EarningsChart
  data={[
    { date: '2025-10-01', far: 12.5 },
    { date: '2025-10-02', far: 15.2 },
    ...
  ]}
/>

// HardwareStats.tsx - GPU, VRAM, temp
<HardwareStats
  gpu="RTX 4090"
  vram={{ used: 18.5, total: 24 }}
  temp={72}
/>

// PaymentHistory.tsx - List of payments
<PaymentHistory
  payments={[
    { date: '2025-10-07', amount: 125.5, tx: '0xabc...' },
    ...
  ]}
/>
```

**API endpoints needed** (add to Far Discovery):
```
GET /provider/{wallet}/stats
GET /provider/{wallet}/earnings
GET /provider/{wallet}/payments
GET /provider/{wallet}/nodes
```

**Implementation time**: 2-3 days
**Deployment time**: Included with frontend

---

#### 4.2 Python SDK 🐍

**Package**: `farlabs`

```python
# Basic usage
from farlabs import FarMesh

mesh = FarMesh(api_key="fl_...")

# Synchronous
response = mesh.chat("Explain quantum computing")
print(response.text)

# Streaming
for token in mesh.chat_stream("Explain quantum computing"):
    print(token, end="", flush=True)

# Async
async def main():
    async for token in mesh.chat_stream_async("..."):
        print(token)
```

**Implementation time**: 1 day
**Publishing time**: 30 min (PyPI)

---

#### 4.3 TypeScript SDK 📦

**Package**: `@farlabs/sdk`

```typescript
import { FarMesh } from "@farlabs/sdk";

const mesh = new FarMesh({ apiKey: "fl_..." });

// Promise-based
const response = await mesh.chat("Explain quantum computing");
console.log(response.text);

// Streaming
const stream = await mesh.chatStream("Explain quantum computing");
for await (const token of stream) {
    process.stdout.write(token);
}

// React hook
import { useFarMesh } from "@farlabs/sdk/react";

function ChatComponent() {
    const { chat, loading } = useFarMesh();

    const handleSubmit = async () => {
        const response = await chat(prompt);
        setResult(response.text);
    };
}
```

**Implementation time**: 1-2 days
**Publishing time**: 30 min (NPM)

---

## Complete Deployment Checklist

### Database
- [ ] Apply migration `004_distributed_inference.sql`
- [ ] Verify tables created: `far_mesh_sessions`, `far_nodes`, `far_session_contributions`, `far_payment_batches`
- [ ] Test views: `active_far_nodes`, `node_earnings_summary`
- [ ] Test functions: `finalize_session()`, `update_node_last_seen()`

### Infrastructure
- [ ] Deploy DHT bootstrap node
- [ ] Configure DNS: `discovery.farlabs.ai` → DHT bootstrap IP
- [ ] Create ECR repositories for new services
- [ ] Update security groups for port 31330 (DHT)

### Services
- [ ] Deploy Far Mesh Coordinator (port 8100)
- [ ] Deploy Far Discovery Service (port 8200)
- [ ] Deploy Payment Tracker (cron job)
- [ ] Configure service mesh/load balancer routes

### Testing
- [ ] Test node registration
- [ ] Test heartbeat mechanism
- [ ] Test distributed inference end-to-end
- [ ] Test payment calculation
- [ ] Test payment execution (testnet)
- [ ] Load test with 10 concurrent requests

### Provider Onboarding
- [ ] Package Far Node Server for download
- [ ] Create GitHub release
- [ ] Write onboarding documentation
- [ ] Create video tutorial
- [ ] Test setup on clean Ubuntu machine

### Frontend
- [ ] Build provider dashboard UI
- [ ] Add distributed inference to main app
- [ ] Update /inference page to use Far Mesh
- [ ] Add provider signup flow

### SDKs & Documentation
- [ ] Publish Python SDK to PyPI
- [ ] Publish TypeScript SDK to NPM
- [ ] Write API documentation
- [ ] Create code examples
- [ ] Update docs site

---

## Risk Mitigation

### Risk 1: Petals Network Instability
**Mitigation**: Fallback to centralized inference if < 3 nodes available

### Risk 2: Payment Errors
**Mitigation**:
- Test extensively on BSC testnet
- Add payment retry logic
- Monitor payment transactions

### Risk 3: No GPU Providers
**Mitigation**:
- Run 3 Far Nodes ourselves initially
- Incentivize early providers with bonus $FAR
- Partner with GPU providers (Vast.ai, RunPod users)

### Risk 4: High Latency
**Mitigation**:
- Monitor p95 latency
- Add geographic routing (route to nearest nodes)
- Set latency budget (< 500ms per token)

---

## Success Metrics

### Week 1 (MVP)
- [ ] Database migrations applied
- [ ] Far Mesh Coordinator deployed
- [ ] DHT bootstrap node running
- [ ] 1 test GPU provider connected
- [ ] End-to-end inference test successful

### Week 2 (Foundation)
- [ ] Discovery service deployed
- [ ] 3+ GPU providers registered
- [ ] 100+ inference requests completed
- [ ] All sessions tracked in database
- [ ] < 500ms average latency

### Week 3 (Payments)
- [ ] Payment tracker deployed
- [ ] First payment batch executed (testnet)
- [ ] Provider dashboard live
- [ ] Earnings visible in real-time

### Week 4 (Launch)
- [ ] Python SDK published
- [ ] TypeScript SDK published
- [ ] 10+ external GPU providers
- [ ] 1,000+ inference requests/day
- [ ] First real payment batch (mainnet)

---

## Immediate Next Steps (Right Now)

### 1. Apply Database Migration (5 min)
```bash
psql -h farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com \
     -U farlabs_admin \
     -d farlabs \
     -f backend/database/migrations/004_distributed_inference.sql
```

### 2. Deploy DHT Bootstrap (Quick Option) (5 min)
```bash
# Use Petals public bootstrap temporarily
# Update all configs with:
FAR_MESH_DHT_BOOTSTRAP=/ip4/petals.dev/tcp/31337
```

### 3. Deploy Far Mesh Coordinator (2-3 hours)
```bash
cd backend/services/far_mesh_coordinator
docker build -t far-mesh-coordinator .
# Push to ECR and deploy to ECS
```

### 4. Build Discovery Service (Tomorrow)
Start implementing `backend/services/far_discovery/`

---

## Summary

**To make the whole system work, you need**:

**Week 1**:
1. ✅ Apply database migration
2. ✅ Deploy Far Mesh Coordinator
3. ✅ Deploy DHT bootstrap node
4. ✅ Test with 1 GPU provider

**Week 2**:
5. Build & deploy Discovery Service
6. Test end-to-end inference
7. Onboard 3-5 GPU providers

**Week 3**:
8. Build & deploy Payment Tracker
9. Build provider dashboard UI
10. Test payment flow

**Week 4**:
11. Build and publish SDKs
12. Polish and launch
13. Onboard external providers

**Total time**: 3-4 weeks to full launch, **1 week to MVP**

The foundation is solid - you have all the core code written. Now it's about deployment and integration! 🚀

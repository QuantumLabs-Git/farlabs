# Far Labs Platform - Deployment Status

**Last Updated**: October 10, 2025

## Overview

This document tracks the current deployment status of all Far Labs services and infrastructure components.

---

## Infrastructure

### AWS Resources (us-east-1)

| Resource | Type | Status | Details |
|----------|------|--------|---------|
| **Database** | RDS PostgreSQL | ✅ Running | `farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com` |
| **Load Balancer** | ALB | ✅ Running | `farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com` |
| **ECS Cluster** | Fargate | ✅ Running | `farlabs-cluster-free` |
| **ECR Registry** | Docker Registry | ✅ Active | `894059646844.dkr.ecr.us-east-1.amazonaws.com` |
| **VPC** | Networking | ✅ Configured | Default VPC with public subnets |

---

## Services Deployment Status

### ✅ Production Services (Running)

#### 1. Authentication Service
- **Status**: ✅ Deployed and Running
- **Image**: `farlabs-auth-free:latest`
- **Endpoint**: `http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth`
- **Container Port**: 8000
- **ECS Service**: `farlabs-auth-service-free`
- **Health**: ✅ Healthy

**Test**:
```bash
curl -s http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/health
# Expected: {"status":"healthy","service":"auth","timestamp":"..."}
```

#### 2. Frontend (Next.js)
- **Status**: ✅ Built and Pushed to ECR
- **Image**: `farlabs-frontend-free:latest`
- **ECR Digest**: `sha256:6e97f000a4f175618e3804519302d5b0acdcb94261fda20b8921dc2346178aef`
- **Build Date**: October 10, 2025
- **Container Port**: 3000
- **ECS Deployment**: ⏳ Pending (needs service creation)

---

### 🔄 Services in Progress

#### 3. Far Mesh Coordinator (Distributed Inference)
- **Status**: 🔄 Building and Deploying
- **Image**: `farlabs-far-mesh-coordinator-free:latest`
- **Container Port**: 8003
- **Dependencies**:
  - ✅ Database migration `004_distributed_inference.sql` applied
  - 🔄 Docker image building
  - ⏳ ECR push pending
  - ⏳ ECS service creation pending

**Purpose**: Coordinates distributed LLM inference across GPU provider network using FarMesh

**Endpoints** (when deployed):
- `POST /inference/generate` - Streaming distributed inference
- `GET /inference/models` - List available models
- `GET /health` - Service health check

#### 4. Inference Service (Single GPU)
- **Status**: 🔄 Building (10-15 min remaining)
- **Image**: `farlabs-inference-free:latest`
- **Container Port**: 8001
- **Base**: Python 3.11 + PyTorch + Transformers
- **Purpose**: Local single-GPU inference fallback

---

### ⏳ Services Not Yet Deployed

#### 5. GPU Worker Client
- **Status**: ✅ Built and Pushed to ECR
- **Image**: `farlabs-gpu-worker-free:latest`
- **Purpose**: Worker that connects to job queue for GPU compute
- **Deployment**: ⏳ Awaiting ECS service configuration

#### 6. Discovery Service (Not Built)
- **Status**: ❌ Not yet created
- **Purpose**: Register and monitor GPU provider nodes
- **Priority**: HIGH - Required for distributed inference
- **Endpoints needed**:
  - `POST /nodes/register` - Register new GPU node
  - `POST /nodes/heartbeat` - Node health updates
  - `GET /nodes/active` - List active nodes

#### 7. Payment Tracker Service (Not Built)
- **Status**: ❌ Not yet created
- **Purpose**: Track token generation, calculate earnings, batch payments
- **Priority**: MEDIUM - Required for provider payments
- **Dependencies**: BNB Smart Chain integration

---

## Database Status

### Migrations Applied

| Migration | Status | Applied Date |
|-----------|--------|--------------|
| `001_initial_schema.sql` | ✅ Applied | (Previous) |
| `002_gpu_marketplace.sql` | ✅ Applied | (Previous) |
| `003_staking.sql` | ✅ Applied | (Previous) |
| `004_distributed_inference.sql` | 🔄 In Progress | October 10, 2025 |

### New Tables (from 004 migration)

- `far_mesh_sessions` - Track inference requests and costs
- `far_nodes` - GPU provider registry
- `far_session_contributions` - Which nodes helped with each session
- `far_payment_batches` - Batch payment tracking

---

## ECR Images Status

| Image Name | Status | Size | Last Push |
|------------|--------|------|-----------|
| `farlabs-auth-free` | ✅ Deployed | ~200MB | Oct 2025 |
| `farlabs-frontend-free` | ✅ Built | ~600MB | Oct 10, 2025 |
| `farlabs-gpu-worker-free` | ✅ Built | ~4.5GB | Oct 10, 2025 |
| `farlabs-inference-free` | 🔄 Building | ~5GB | In Progress |
| `farlabs-far-mesh-coordinator-free` | 🔄 Building | ~500MB | In Progress |

---

## Immediate Next Steps (Priority Order)

### 1. Complete Far Mesh Coordinator Deployment (30 min)
- [x] Apply database migration
- [x] Build Docker image
- [ ] Push to ECR
- [ ] Create ECS task definition
- [ ] Create ECS service
- [ ] Add ALB target group for port 8003
- [ ] Test distributed inference endpoint

### 2. Create Discovery Service (2-3 hours)
```python
# /backend/services/discovery/
- server.py          # FastAPI service
- node_registry.py   # Track active GPU nodes
- Dockerfile
- requirements.txt
```

**Key Features**:
- Node registration with hardware specs
- Heartbeat monitoring (mark offline after 60s)
- Query active nodes by model/capabilities
- Integration with Far Mesh Coordinator

### 3. Deploy Complete Stack to ECS (1 hour)
- Frontend service
- GPU Worker Client service
- Discovery Service
- Configure ALB routing for all services

### 4. Build Payment Tracker Service (3-4 hours)
```python
# /backend/services/payment_tracker/
- server.py              # Cron job + API
- earnings_calculator.py # Token count -> FAR amount
- batch_payout.py        # Weekly batch payments
- blockchain_client.py   # BNB Chain integration
```

**Cron Schedule**:
- Every Monday 00:00 UTC: Calculate weekly earnings
- Batch payments to providers (minimum 10 FAR)
- On-chain transaction logging

---

## Testing Plan

### Phase 1: Single Service Testing
- [x] Auth service working
- [ ] Far Mesh Coordinator deployed
- [ ] Test inference: `POST /inference/generate` with sample prompt
- [ ] Verify database session tracking

### Phase 2: Integration Testing
- [ ] Deploy Discovery Service
- [ ] Run test GPU node (local machine or EC2)
- [ ] Node registers successfully
- [ ] Coordinator discovers node via DHT
- [ ] End-to-end distributed inference works

### Phase 3: Provider Onboarding
- [ ] Create provider dashboard UI
- [ ] Test provider signup flow
- [ ] Verify earnings tracking
- [ ] Test payment distribution (testnet)

---

## Configuration Files

### Environment Variables (Secrets Manager / ECS Task Definition)

```bash
# Shared
DATABASE_URL=postgresql://farlabs_admin:FarLabs2025SecurePass!@farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com/farlabs

# Far Mesh Coordinator
MODEL_ID=meta-llama/Llama-2-7b-chat-hf
DHT_BOOTSTRAP_ADDR=/ip4/farmesh.dev/tcp/31337
PRICE_PER_TOKEN_FAR=0.0001
COORDINATOR_PORT=8003

# Discovery Service
DISCOVERY_PORT=8002
NODE_TIMEOUT_SECONDS=60
HEARTBEAT_INTERVAL=30

# Payment Tracker
PAYMENT_SCHEDULE="0 0 * * MON"  # Weekly Monday midnight
MINIMUM_PAYOUT_FAR=10
BSC_RPC_URL=https://bsc-dataseed.binance.org/
FAR_TOKEN_ADDRESS=0x... # TBD
```

---

## Known Issues & Limitations

### Current Limitations
1. **No DHT Bootstrap Node**: Using FarMesh public bootstrap temporarily
2. **Discovery Service Missing**: Nodes can't register yet
3. **No Payment System**: Provider earnings not tracked/paid
4. **Single Region**: All in us-east-1 (expand later)

### Resolved Issues
- [x] Frontend build warnings (non-blocking)
- [x] EC2 instance disk space (used 30GB instance)
- [x] Database migration ready

---

## Cost Tracking

### Monthly AWS Costs (Estimated)

| Service | Cost/Month | Status |
|---------|------------|--------|
| RDS PostgreSQL (db.t3.micro) | ~$15 | Running |
| ECS Fargate (5 services x 0.5 vCPU) | ~$35 | Partial |
| ALB | ~$20 | Running |
| ECR Storage (~15GB) | ~$1.50 | Active |
| Data Transfer | ~$10 | Active |
| **Total** | **~$81.50/month** | |

### Optimization Opportunities
- Use ECS capacity providers for spot instances
- Implement auto-scaling (scale to 0 during low usage)
- Use S3 for model weights (vs embedding in images)
- Multi-region CDN for frontend (CloudFront)

---

## Rollback Plan

### If Deployment Fails

1. **Database Migration Issues**:
```sql
-- Rollback 004_distributed_inference.sql
DROP TABLE IF EXISTS far_payment_batches CASCADE;
DROP TABLE IF EXISTS far_session_contributions CASCADE;
DROP TABLE IF EXISTS far_nodes CASCADE;
DROP TABLE IF EXISTS far_mesh_sessions CASCADE;
```

2. **Service Issues**:
```bash
# Stop ECS service
aws ecs update-service --cluster farlabs-cluster-free \
  --service farlabs-far-mesh-coordinator-free \
  --desired-count 0

# Delete service if needed
aws ecs delete-service --cluster farlabs-cluster-free \
  --service farlabs-far-mesh-coordinator-free --force
```

3. **Rollback to Previous Image**:
```bash
# List image versions
aws ecr describe-images --repository-name farlabs-far-mesh-coordinator-free

# Update ECS task def to previous digest
```

---

## Success Metrics

### Week 1 MVP Targets
- [ ] Far Mesh Coordinator deployed and healthy
- [ ] 1 test GPU provider node connected
- [ ] End-to-end distributed inference working
- [ ] Database tracking sessions/tokens correctly

### Week 2 Targets
- [ ] Discovery Service deployed
- [ ] 3-5 GPU providers onboarded
- [ ] Provider dashboard showing real-time stats
- [ ] 10,000+ tokens generated through network

### Week 4 Launch Targets
- [ ] Payment system operational (testnet)
- [ ] 10+ external GPU providers
- [ ] Python + TypeScript SDKs published
- [ ] Public documentation live
- [ ] 100,000+ tokens generated

---

## Support & Monitoring

### Monitoring (To Set Up)
- [ ] CloudWatch dashboards for all services
- [ ] Alerts for service down > 5 min
- [ ] Database connection pool monitoring
- [ ] Token generation rate tracking
- [ ] Provider node uptime tracking

### Logging
- All services log to CloudWatch Logs
- Log groups: `/ecs/{service-name}`
- Retention: 7 days (increase for production)

---

## Contact & Resources

- **AWS Account ID**: 894059646844
- **Region**: us-east-1 (N. Virginia)
- **ALB Endpoint**: `farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com`
- **Documentation**: `docs/` folder in codebase
- **Action Plan**: `docs/ACTION_PLAN_TO_LAUNCH.md`

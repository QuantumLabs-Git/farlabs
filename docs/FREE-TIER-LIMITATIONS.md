# Far Labs Free Tier - Known Limitations

## ⚠️ Critical Issues

### 1. **No Data Persistence** (MOST CRITICAL)

**Problem:** No RDS database, only Redis (in-memory storage)

**Impact:**
- ❌ All data lost when Redis restarts
- ❌ No permanent record of transactions
- ❌ User balances reset to zero
- ❌ Staking positions disappear
- ❌ GPU node registrations lost
- ❌ Inference task history gone

**When This Happens:**
- Redis cluster maintenance
- Manual service restarts
- Instance failures
- AWS infrastructure updates

**Workaround:**
```bash
# Option 1: Add RDS (costs ~$15/month for db.t3.micro)
# This defeats the free-tier purpose but gives persistence

# Option 2: Accept data loss for testing
# Just re-register and re-test after restarts

# Option 3: Use local Redis snapshots (manual backup)
# Not recommended for production
```

**For Testing:** This is fine - just re-seed test data after restarts.

### 2. **Service Discovery Issues**

**Problem:** Using public subnets instead of private subnets + NAT Gateway

**Impact:**
- ⚠️ Internal service communication may fail
- ⚠️ Services can't reliably find each other via `.internal` DNS
- ⚠️ API Gateway → Service routing may not work

**Workaround:**
```bash
# Services need to communicate via ALB or direct IPs
# We need to modify the architecture slightly
```

**Status:** This needs a fix. Two options:

#### Option A: Keep It Simple - All Traffic Through ALB
Modify services to call through the public ALB instead of service discovery.

**Pros:**
- Works immediately
- No additional config needed

**Cons:**
- Extra latency (extra network hop)
- More ALB traffic (still within free tier for testing)

#### Option B: Add NAT Gateway (~$32/month)
```hcl
# Costs $0.045/hour = ~$32/month
# Plus $0.045 per GB processed

# Defeats the free-tier purpose
```

### 3. **Limited Memory (512MB per task)**

**Problem:** Fargate tasks have only 512MB RAM

**Impact:**
- ⚠️ Frontend may run out of memory under load
- ⚠️ Inference service can't load actual ML models
- ⚠️ Services may crash under concurrent requests

**When This Happens:**
- Multiple concurrent users
- Large inference requests
- Image processing tasks

**Workaround:**
```bash
# Increase to 1024MB (still free tier eligible)
# Edit ecs-free-tier.tf, change:
memory = "1024"  # from "512"

# Then redeploy:
terraform apply
```

**Cost Impact:** Still FREE (within 750 hours/month limit)

### 4. **No Auto-Scaling**

**Problem:** Single instance per service, no auto-scaling

**Impact:**
- ❌ Service goes down if instance crashes
- ❌ Slow response under load
- ❌ No redundancy/high availability

**Workaround:** Manually restart failed services:
```bash
aws ecs update-service \
    --cluster farlabs-cluster-free \
    --service farlabs-frontend-free \
    --force-new-deployment
```

### 5. **ECR Storage Limit (500MB)**

**Problem:** Free tier includes only 500MB ECR storage

**Impact:**
- ⚠️ Can only store 7 images (~70MB each)
- ⚠️ Can't keep multiple versions
- ⚠️ Must delete old images regularly

**Current Images (~400MB total):**
- Frontend: ~100MB
- API Gateway: ~50MB
- Auth: ~40MB
- Payments: ~50MB
- Inference: ~80MB
- Inference Worker: ~40MB
- GPU: ~40MB

**Workaround:**
```bash
# Already configured: Lifecycle policy keeps only 1 image per repo
# Automatic cleanup in ecs-free-tier.tf
```

### 6. **CloudWatch Logs Limit (5GB/month)**

**Problem:** Free tier includes 5GB log ingestion per month

**Impact:**
- ⚠️ ~166MB logs per day
- ⚠️ ~23MB per service per day
- ⚠️ May exceed limit under heavy use

**Workaround:**
```bash
# Already configured: 1-day retention
# Logs automatically deleted after 24 hours
```

**If Exceeded:** $0.50 per GB over limit

### 7. **No WebSocket Service**

**Problem:** WebSocket service not included in free-tier deployment

**Impact:**
- ❌ No real-time inference result streaming
- ❌ Must poll for results instead
- ❌ Slower UX for inference playground

**Workaround:**
```bash
# Use polling instead of WebSocket
# Already handled in inference service (/api/inference/tasks/{id})
```

### 8. **No Production Services**

**Not Included to Save Costs:**
- ❌ Staking Service (optional for testing)
- ❌ Gaming Service
- ❌ DeSci Service
- ❌ GameD Service
- ❌ WebSocket Service

**Impact:** These features won't work in the UI

**Workaround:** Add back if needed (still within free tier if under 750 hours total)

### 9. **No HTTPS/SSL**

**Problem:** No ACM certificate, no CloudFront CDN

**Impact:**
- ⚠️ HTTP only (not HTTPS)
- ⚠️ Wallet connections may fail (MetaMask prefers HTTPS)
- ⚠️ Browser security warnings

**Workaround:**
```bash
# For testing with MetaMask, use localhost tunneling:
# ngrok http 80
# Or: cloudflared tunnel

# Or: Add ACM certificate (free) manually
```

### 10. **Public IP Addresses for ECS Tasks**

**Problem:** Tasks run in public subnets with public IPs

**Impact:**
- ⚠️ Less secure (direct internet exposure)
- ⚠️ Not following AWS best practices
- ⚠️ Services accessible from internet (if security group allows)

**Mitigation:**
```bash
# Security groups restrict access
# Only ALB can reach the services
# Good enough for testing
```

### 11. **No Database = No Postgres-Specific Features**

**Problem:** Some services may expect Postgres features

**Impact:**
- ❌ No ACID transactions
- ❌ No foreign keys
- ❌ No complex queries
- ❌ No SQL-based reporting

**Current Impact:** None - all services currently use Redis

**Future Impact:** If you add Postgres-specific code later

## 🔧 Recommended Fixes

### Fix #1: Increase Memory to 1024MB (FREE)

```bash
# Edit infra/terraform/ecs-free-tier.tf
# Find all instances of:
memory = "512"

# Change to:
memory = "1024"

# Redeploy:
cd infra/terraform
terraform apply
```

### Fix #2: Modify Service Communication

Create a new file `backend/api-gateway/main-free-tier.py` that uses ALB instead of service discovery:

```python
SERVICE_ROUTES = {
    "inference": os.getenv("INFERENCE_URL", "http://localhost:8005"),
    "gpu": os.getenv("GPU_URL", "http://localhost:8004"),
    "payments": os.getenv("PAYMENTS_URL", "http://localhost:8002"),
    "auth": os.getenv("AUTH_URL", "http://localhost:8001"),
}
```

Then set environment variables in ECS task definitions.

### Fix #3: Add Minimal RDS (~$15/month)

```hcl
# Add to main-free-tier.tf
resource "aws_db_instance" "postgres" {
  identifier           = "farlabs-postgres-free"
  engine              = "postgres"
  engine_version      = "15.5"
  instance_class      = "db.t3.micro"  # ~$15/month
  allocated_storage   = 20
  storage_type        = "gp2"
  db_name             = "farlabs"
  username            = "farlabs"
  password            = var.db_password
  skip_final_snapshot = true
  publicly_accessible = false
}
```

**New Cost:** ~$27/month total (Redis $12 + RDS $15)

## ✅ What DOES Work

Despite limitations, these work perfectly:

- ✅ User authentication (JWT)
- ✅ API Gateway routing
- ✅ Payments ledger (in Redis)
- ✅ Inference tasks (simulated)
- ✅ GPU node registration
- ✅ All REST API endpoints
- ✅ Frontend UI (basic functionality)
- ✅ Load balancing
- ✅ Health checks
- ✅ Logging

## 📊 Testing Strategy

Given the limitations:

1. **Accept data loss** - Re-seed test data as needed
2. **Test core flows** - Auth, payments, inference all work
3. **Monitor costs** - Set up billing alerts
4. **Plan migration** - When ready, upgrade to full setup

## 🎯 When to Upgrade to Full Setup

Upgrade when you need:
- ✅ Data persistence (RDS)
- ✅ High availability (Multi-AZ)
- ✅ Production traffic handling
- ✅ Auto-scaling
- ✅ Better security (private subnets)
- ✅ HTTPS/SSL
- ✅ All 12 services

## 💡 Hybrid Approach

**Best of Both Worlds:**

Keep free tier infrastructure, add only RDS:
- Cost: ~$27/month (vs $800-1000)
- Gets: Data persistence
- Still cheap for first 12 months

```bash
# Add to your terraform:
# Just the db.t3.micro RDS instance
# Keep everything else as-is
```

## Summary

| Issue | Severity | Workaround | Cost to Fix |
|-------|----------|------------|-------------|
| No data persistence | 🔴 Critical | Accept data loss | +$15/mo RDS |
| Service discovery | 🟡 Medium | Use ALB routing | $0 (code change) |
| Limited memory | 🟡 Medium | Increase to 1024MB | $0 (still free) |
| No auto-scaling | 🟡 Medium | Manual restarts | +$400/mo (full setup) |
| ECR storage limit | 🟢 Low | Auto-cleanup enabled | $0.10/GB |
| No HTTPS | 🟡 Medium | Use ngrok/cloudflared | $0 (manual) |
| Public subnets | 🟢 Low | Security groups | +$32/mo NAT |

**Bottom Line:** For **testing and demos**, the free-tier setup works great. For **production**, upgrade to full setup or at minimum add RDS.

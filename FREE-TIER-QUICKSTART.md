# 🚀 Far Labs - Free Tier Quick Start

Deploy the complete Far Labs platform on AWS for **$27/month** during your first 12 months!

> **Includes PostgreSQL database for data persistence!**

## ⚡ Deploy in 3 Commands

```bash
# 1. Make scripts executable
chmod +x scripts/*.sh

# 2. Deploy infrastructure (~10 minutes)
./scripts/deploy-free-tier.sh

# 3. Build and deploy application (~15 minutes)
./scripts/build-and-push-free.sh
```

**Total time: ~25 minutes**

## 💰 What You Get

### Free (First 12 Months)
- ✅ 7 microservices on ECS Fargate (750 hours/month free)
- ✅ Application Load Balancer (750 hours/month free)
- ✅ Docker image storage in ECR (500MB free)
- ✅ CloudWatch logs (5GB/month free)
- ✅ S3 storage (5GB free)

### Minimal Cost
- 💵 **PostgreSQL database (db.t3.micro)**: ~$15/month ⭐ NEW
- 💵 Redis cache (t3.micro): ~$12/month
- 💵 Data transfer (if exceeds 100GB): $0.09/GB

**Total: $27/month** vs full production setup at $800-1000/month

### 🎉 With PostgreSQL You Get
- ✅ **Data persists through restarts**
- ✅ **Transaction history saved**
- ✅ **User balances preserved**
- ✅ **20GB database storage**
- ✅ **Daily automated backups**
- ✅ **Production-ready data layer**

## 🎯 What's Deployed

- **Frontend**: Next.js app with wallet integration
- **API Gateway**: Authentication and routing
- **Auth Service**: JWT token management
- **Payments Service**: Redis-backed ledger
- **Inference Service**: AI task orchestration
- **Inference Worker**: Background processing
- **GPU Service**: Node registration

## 📋 Prerequisites

```bash
# Check AWS CLI is configured
aws sts get-caller-identity

# Verify Docker is running
docker ps

# Confirm you're in first 12 months
# (Check your AWS account creation date)
```

## 🚀 Deployment

### Step 1: Clone & Prepare

```bash
git clone <your-repo>
cd far-labs-platform
chmod +x scripts/*.sh
```

### Step 2: Deploy Infrastructure

```bash
./scripts/deploy-free-tier.sh
```

This creates:
- VPC with 2 public subnets
- Application Load Balancer
- ECS Cluster
- ElastiCache Redis (t3.micro)
- ECR repositories
- CloudWatch log groups
- S3 buckets

**Time: ~10 minutes**

### Step 3: Deploy Application

```bash
./scripts/build-and-push-free.sh
```

This builds and deploys all 7 services.

**Time: ~15 minutes**

### Step 4: Access Your App

```bash
# Get your URL
cd infra/terraform
terraform output frontend_url

# Should show: http://<alb-dns-name>.us-east-1.elb.amazonaws.com
```

Visit the URL in your browser!

## 🧪 Test It Out

```bash
ALB_DNS=$(cd infra/terraform && terraform output -raw alb_dns_name)

# 1. Get authentication token
TOKEN=$(curl -s -X POST http://$ALB_DNS/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}' \
    | jq -r .token)

# 2. Top up balance
curl -X POST http://$ALB_DNS/api/payments/topup \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "amount": 100.0}'

# 3. Register GPU node
curl -X POST http://$ALB_DNS/api/gpu/nodes \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "gpu_model": "NVIDIA A100", "vram_gb": 80, "bandwidth_gbps": 10.0}'

# 4. Run inference
curl -X POST http://$ALB_DNS/api/inference/generate \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"model_id": "llama-70b", "prompt": "Hello world", "max_tokens": 100}'
```

## 📊 Monitor Costs

### Set Up Billing Alert

```bash
# Create alert for $25/month
aws budgets create-budget \
    --account-id $(aws sts get-caller-identity --query Account --output text) \
    --budget '{
        "BudgetName": "FarLabs-Monthly",
        "BudgetLimit": {"Amount": "25", "Unit": "USD"},
        "TimeUnit": "MONTHLY",
        "BudgetType": "COST"
    }'
```

### Check Current Costs

```bash
# Open AWS Cost Explorer
echo "https://console.aws.amazon.com/cost-management/home"
```

## 🛑 Stop/Start Services

### Stop All Services (to pause costs)

```bash
aws ecs update-service --cluster farlabs-cluster-free --service farlabs-frontend-free --desired-count 0
aws ecs update-service --cluster farlabs-cluster-free --service farlabs-api-free --desired-count 0
aws ecs update-service --cluster farlabs-cluster-free --service farlabs-auth-free --desired-count 0
aws ecs update-service --cluster farlabs-cluster-free --service farlabs-payments-free --desired-count 0
aws ecs update-service --cluster farlabs-cluster-free --service farlabs-inference-free --desired-count 0
aws ecs update-service --cluster farlabs-cluster-free --service farlabs-inference-worker-free --desired-count 0
aws ecs update-service --cluster farlabs-cluster-free --service farlabs-gpu-free --desired-count 0
```

### Start Services Again

Replace `--desired-count 0` with `--desired-count 1` in the commands above.

## 🧹 Complete Teardown

When you're done testing:

```bash
cd infra/terraform
terraform destroy
# Type 'yes' to confirm
```

This removes all resources and stops all charges.

## 🔧 Troubleshooting

### Services Won't Start

```bash
# Check service status
aws ecs describe-services --cluster farlabs-cluster-free --services farlabs-frontend-free

# View logs
aws logs tail /ecs/farlabs-frontend-free --follow
```

### Out of Memory

```bash
# Increase memory allocation
# Edit infra/terraform/ecs-free-tier.tf
# Change memory from "512" to "1024"
terraform apply
```

### Can't Access Application

```bash
# Check ALB health
aws elbv2 describe-target-health \
    --target-group-arn $(aws elbv2 describe-target-groups \
        --names farlabs-frontend-free-tg \
        --query 'TargetGroups[0].TargetGroupArn' --output text)
```

## 💡 Tips to Minimize Costs

1. **Run only when needed** - Stop services during off-hours
2. **1-day log retention** - Already configured
3. **No CloudFront** - Direct ALB access
4. **Single instances** - No redundancy needed for testing
5. **Small tasks** - 256 CPU / 512 MB memory

## 📚 Full Documentation

- **Detailed Guide**: [docs/FREE-TIER-DEPLOYMENT.md](docs/FREE-TIER-DEPLOYMENT.md)
- **Full Production**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Architecture**: [docs/System-Architecture.md](docs/System-Architecture.md)

## ⚠️ Important Notes

- ✅ Perfect for testing and development
- ✅ Works great for demos and POCs
- ⚠️ Not production-ready (single instances, no database)
- ⚠️ Data stored in Redis only (lost on restart)
- ⚠️ Free tier valid for 12 months from AWS account creation
- ⚠️ Redis costs ~$12/month (smallest available)

## 🎉 You're All Set!

Your Far Labs platform is now running on AWS for approximately **$12-20/month**!

Need help? Check:
- [FREE-TIER-DEPLOYMENT.md](docs/FREE-TIER-DEPLOYMENT.md) - Detailed troubleshooting
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Production deployment guide

Enjoy testing! 🚀

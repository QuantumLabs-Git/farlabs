# Far Labs - AWS Free Tier Deployment Guide

Deploy the Far Labs platform on AWS using free-tier eligible services and minimal cost resources perfect for testing during your first 12 months.

## 💰 Cost Breakdown

### Free Tier Services (First 12 Months)
- ✅ **ECS Fargate**: 750 hours/month (enough for 7 services running 24/7)
- ✅ **Application Load Balancer**: 750 hours/month
- ✅ **ECR**: 500MB storage
- ✅ **CloudWatch Logs**: 5GB ingestion/month
- ✅ **S3**: 5GB storage, 20,000 GET requests, 2,000 PUT requests/month
- ✅ **Data Transfer**: 100GB outbound/month

### Minimal Paid Services
- 💵 **ElastiCache Redis (t3.micro)**: ~$12-15/month (smallest available)

### **Total Estimated Cost: $12-20/month**

Compare to full production setup: **$800-1000/month**

## ⚙️ What's Different in Free Tier Setup?

| Feature | Full Setup | Free Tier Setup |
|---------|-----------|-----------------|
| **ECS Tasks** | 2 instances per service | 1 instance per service |
| **CPU/Memory** | 512 CPU / 1024 MB | 256 CPU / 512 MB |
| **Database** | RDS r5.xlarge Multi-AZ ($300/mo) | Redis only (data in memory) |
| **Redis** | cache.r6g.xlarge ($180/mo) | cache.t3.micro ($12/mo) |
| **NAT Gateway** | 2x NAT ($90/mo) | Public subnets (free) |
| **CloudFront** | CDN enabled | Disabled |
| **Log Retention** | 7 days | 1 day |
| **Container Insights** | Enabled | Disabled |
| **Auto-scaling** | Yes | No |
| **Services Deployed** | 12 services | 7 core services |

## 🚀 Quick Start Deployment

### Prerequisites

- AWS Account in first 12 months
- AWS CLI installed and configured
- Docker Desktop running
- Git repository

### Step 1: Prepare AWS Account

```bash
# Verify AWS CLI is configured
aws sts get-caller-identity

# Set your region
export AWS_REGION=us-east-1
```

### Step 2: One-Command Deployment

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy everything
./scripts/deploy-free-tier.sh
```

This script will:
1. ✅ Prepare free-tier Terraform configuration
2. ✅ Create VPC, subnets, and networking
3. ✅ Deploy Application Load Balancer
4. ✅ Create ECS cluster
5. ✅ Launch ElastiCache Redis
6. ✅ Set up ECR repositories
7. ✅ Create CloudWatch log groups

**Time: ~10-15 minutes**

### Step 3: Build and Deploy Application

```bash
# Build Docker images and push to ECR
./scripts/build-and-push-free.sh
```

This will:
1. ✅ Build all 7 service images
2. ✅ Push to ECR
3. ✅ Trigger ECS service deployments

**Time: ~15-20 minutes**

### Step 4: Access Your Application

```bash
# Get your application URL
cd infra/terraform
terraform output frontend_url
```

Visit the URL in your browser!

```bash
# Test API
ALB_DNS=$(terraform output -raw alb_dns_name)
curl http://$ALB_DNS/healthz
```

## 📋 Manual Deployment Steps

If you prefer step-by-step deployment:

### 1. Deploy Infrastructure

```bash
cd infra/terraform

# Copy free-tier configs
cp main-free-tier.tf main.tf
cp ecs-free-tier.tf ecs.tf

# Create variables
cat > terraform.tfvars << EOF
region = "us-east-1"
EOF

# Deploy
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 2. Build Images Locally

```bash
cd ../..
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push frontend
docker build -f frontend/Dockerfile frontend \
    -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/farlabs-frontend-free:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/farlabs-frontend-free:latest

# Repeat for other services...
```

### 3. Update ECS Services

```bash
aws ecs update-service \
    --cluster farlabs-cluster-free \
    --service farlabs-frontend-free \
    --force-new-deployment
```

## 🧪 Testing Your Deployment

### 1. Check Service Health

```bash
aws ecs describe-services \
    --cluster farlabs-cluster-free \
    --services farlabs-frontend-free farlabs-api-free
```

### 2. Test Authentication

```bash
ALB_DNS=$(cd infra/terraform && terraform output -raw alb_dns_name)

# Get JWT token
TOKEN=$(curl -s -X POST http://$ALB_DNS/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}' \
    | jq -r .token)

echo "Token: $TOKEN"
```

### 3. Test Payments

```bash
# Top up balance
curl -X POST http://$ALB_DNS/api/payments/topup \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "amount": 100.0,
        "reference": "test-topup"
    }'

# Check balance
curl http://$ALB_DNS/api/payments/balances/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
    -H "Authorization: Bearer $TOKEN"
```

### 4. Test Inference

```bash
# Run inference task
curl -X POST http://$ALB_DNS/api/inference/generate \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "model_id": "llama-70b",
        "prompt": "Explain blockchain in simple terms",
        "max_tokens": 200,
        "temperature": 0.7
    }'
```

## 📊 Monitoring Costs

### AWS Cost Explorer

```bash
# Open Cost Explorer
echo "https://console.aws.amazon.com/cost-management/home?region=us-east-1#/cost-explorer"
```

### Set Up Billing Alerts

```bash
# Create SNS topic for alerts
aws sns create-topic --name farlabs-billing-alerts

# Subscribe your email
aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:farlabs-billing-alerts \
    --protocol email \
    --notification-endpoint your-email@example.com
```

Create budget alert:
```bash
aws budgets create-budget \
    --account-id YOUR_ACCOUNT_ID \
    --budget file://budget.json
```

budget.json:
```json
{
  "BudgetName": "FarLabs-Monthly",
  "BudgetLimit": {
    "Amount": "25",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

## 🔧 Troubleshooting

### Services Not Starting

```bash
# Check ECS service events
aws ecs describe-services \
    --cluster farlabs-cluster-free \
    --services farlabs-frontend-free

# View logs
aws logs tail /ecs/farlabs-frontend-free --follow
```

### Out of Memory Errors

The 512MB tasks may run out of memory. If this happens:

```bash
# Option 1: Increase memory to 1024MB (still free tier eligible)
# Edit ecs-free-tier.tf, change memory from "512" to "1024"

# Option 2: Reduce number of running services
aws ecs update-service \
    --cluster farlabs-cluster-free \
    --service farlabs-gaming-free \
    --desired-count 0
```

### Redis Connection Issues

```bash
# Check Redis status
aws elasticache describe-cache-clusters \
    --cache-cluster-id farlabs-redis-free \
    --show-cache-node-info

# Verify security group
aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=farlabs-redis-sg-free"
```

### Image Pull Errors

```bash
# Check ECR repository
aws ecr describe-repositories

# Check IAM permissions
aws iam get-role --role-name farlabs-ecs-task-execution-role-free
```

## 🧹 Cleanup / Tear Down

### Destroy Everything

```bash
cd infra/terraform

# Destroy all resources
terraform destroy

# Confirm with 'yes'
```

### Or Delete Specific Resources

```bash
# Stop ECS services
aws ecs update-service \
    --cluster farlabs-cluster-free \
    --service farlabs-frontend-free \
    --desired-count 0

# Delete ECR images
aws ecr batch-delete-image \
    --repository-name farlabs-frontend-free \
    --image-ids imageTag=latest
```

## 💡 Optimization Tips

### 1. Reduce Log Costs

```bash
# Set shorter retention (already set to 1 day in free-tier config)
aws logs put-retention-policy \
    --log-group-name /ecs/farlabs-frontend-free \
    --retention-in-days 1
```

### 2. Use Fargate Spot (50% cheaper)

For non-critical workloads, modify task definitions:

```hcl
capacity_provider_strategy {
  capacity_provider = "FARGATE_SPOT"
  weight            = 100
  base              = 0
}
```

### 3. Run Services Only When Needed

```bash
# Stop services during off-hours
aws ecs update-service \
    --cluster farlabs-cluster-free \
    --service farlabs-frontend-free \
    --desired-count 0

# Start when needed
aws ecs update-service \
    --cluster farlabs-cluster-free \
    --service farlabs-frontend-free \
    --desired-count 1
```

### 4. Use CloudWatch Logs Insights Carefully

Queries cost $0.005 per GB scanned. Use filters to reduce data scanned.

## 📈 Scaling Beyond Free Tier

When you're ready for production:

1. **Switch to full config**
   ```bash
   cp main-full.tf.bak main.tf
   cp ecs-full.tf.bak ecs.tf
   terraform plan
   terraform apply
   ```

2. **Add RDS database**
3. **Enable Multi-AZ**
4. **Add NAT Gateways**
5. **Enable CloudFront CDN**
6. **Increase task counts**
7. **Enable auto-scaling**

## 🎯 Services Deployed

### Core Services (7 total)

1. **Frontend** - Next.js application
2. **API Gateway** - Request routing and auth
3. **Auth Service** - JWT token management
4. **Payments Service** - Ledger operations
5. **Inference Service** - AI task orchestration
6. **Inference Worker** - Background processing
7. **GPU Service** - Node management

### Services Not Included (to save costs)

- Staking Service
- WebSocket Service
- Gaming Service
- DeSci Service
- GameD Service

These can be added later if needed.

## 📞 Support

If you encounter issues:

1. Check CloudWatch Logs
2. Review ECS service events
3. Verify security group rules
4. Check IAM permissions
5. Review [DEPLOYMENT.md](DEPLOYMENT.md) for general guidance

## ⚠️ Important Notes

- Free tier limits apply for 12 months from AWS account creation
- ElastiCache Redis will cost ~$12/month (no free tier)
- Stay within free tier limits to avoid charges
- Set up billing alerts!
- Data is stored in Redis (in-memory) - will be lost if Redis restarts
- Not suitable for production (no database, single instances)
- Perfect for testing and development

## 🎉 Success!

You now have a fully functional Far Labs platform running on AWS for approximately **$12-20/month** during your first 12 months!

Monitor your costs and enjoy testing!

# Far Labs Deployment Guide

This guide provides complete instructions for deploying the Far Labs platform to AWS.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- Terraform >= 1.7.0
- Docker Desktop
- Node.js >= 20 (for local frontend development)
- Python >= 3.11 (for local backend development)

## Quick Start - Local Development

### 1. Local Deployment with Docker Compose

The fastest way to run the entire stack locally:

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start all services
./scripts/local-deploy.sh
```

This will start:
- Frontend at http://localhost:3000
- API Gateway at http://localhost:8000
- All backend microservices
- Redis for caching

### 2. Manual Local Development

For individual service development:

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

#### Backend Services
```bash
# Auth Service
cd backend/services/auth
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Payments Service
cd backend/services/payments
pip install -r requirements.txt
uvicorn main:app --reload --port 8002

# Staking Service
cd backend/services/staking
pip install -r requirements.txt
uvicorn main:app --reload --port 8003

# GPU Service
cd backend/services/gpu
pip install -r requirements.txt
uvicorn main:app --reload --port 8004

# Inference Service
cd backend/services/inference
pip install -r requirements.txt
uvicorn main:app --reload --port 8005

# Inference Worker
cd backend/services/inference_worker
pip install -r requirements.txt
python main.py

# API Gateway
cd backend/api-gateway
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## AWS Production Deployment

### Step 1: Configure AWS Credentials

Set up AWS credentials and region:

```bash
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=<your-account-id>

# Configure AWS CLI
aws configure
```

### Step 2: Create S3 Backend for Terraform State

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://farlabs-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket farlabs-terraform-state \
    --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
    --table-name farlabs-terraform-lock \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### Step 3: Set Up Secrets and Parameters

```bash
# Set required environment variables
export JWT_SECRET=$(openssl rand -base64 32)
export DB_PASSWORD=<secure-password>
export TREASURY_WALLET=<treasury-wallet-address>
export STAKER_POOL_WALLET=<staker-pool-wallet-address>
export INFERENCE_PAYMENT_CONTRACT=<contract-address>

# Run secrets setup script
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

### Step 4: Deploy Infrastructure with Terraform

```bash
# Navigate to Terraform directory
cd infra/terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars file
cat > terraform.tfvars << EOF
region = "us-east-1"
db_username = "farlabs_admin"
db_password = "<secure-db-password>"
EOF

# Plan deployment
terraform plan -out=tfplan

# Review the plan, then apply
terraform apply tfplan

# Save outputs
terraform output > ../../terraform-outputs.txt
```

Or use the deployment script:

```bash
chmod +x scripts/deploy-terraform.sh
./scripts/deploy-terraform.sh
```

### Step 5: Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):

Required secrets:
- `AWS_ACCOUNT_ID` - Your AWS account ID
- `AWS_IAM_ROLE_ARN` - ARN of the IAM role for GitHub Actions
- `AWS_REGION` - AWS region (e.g., us-east-1)

Optional application secrets (if not using Secrets Manager):
- `JWT_SECRET`
- `DB_PASSWORD`
- `NEXT_PUBLIC_DEMO_JWT`

### Step 6: Build and Push Docker Images

#### Option A: Using GitHub Actions (Recommended)

Push to the main branch to trigger automatic deployment:

```bash
git add .
git commit -m "Deploy Far Labs platform"
git push origin main
```

The GitHub Actions workflow will:
1. Build all Docker images
2. Push to ECR
3. Update ECS services

#### Option B: Manual Docker Build and Push

```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | \
    docker login --username AWS --password-stdin \
    $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push each service
# Frontend
docker build -f frontend/Dockerfile frontend -t $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/farlabs-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/farlabs-frontend:latest

# API Gateway
docker build -f backend/api-gateway/Dockerfile backend/api-gateway -t $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/farlabs-api-gateway:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/farlabs-api-gateway:latest

# Auth Service
docker build -f backend/services/auth/Dockerfile backend/services/auth -t $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/farlabs-auth:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/farlabs-auth:latest

# Payments Service
docker build -f backend/services/payments/Dockerfile backend/services/payments -t $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/farlabs-payments:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/farlabs-payments:latest

# Continue for all other services...
```

### Step 7: Verify Deployment

```bash
# Get ALB DNS name
ALB_DNS=$(terraform output -raw alb_dns_name)

# Test API Gateway health
curl http://$ALB_DNS/healthz

# Test authentication
curl -X POST http://$ALB_DNS/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"wallet_address": "0x1234567890123456789012345678901234567890"}'

# Access frontend
echo "Frontend available at: http://$ALB_DNS"
```

## Post-Deployment Configuration

### 1. Configure Custom Domain (Optional)

1. Create a Route 53 hosted zone for your domain
2. Create an ACM certificate for HTTPS
3. Update ALB listener to use HTTPS
4. Add Route 53 A record pointing to ALB

### 2. Enable CloudWatch Alarms

```bash
# Example: Create high CPU alarm
aws cloudwatch put-metric-alarm \
    --alarm-name farlabs-ecs-high-cpu \
    --alarm-description "Alert when ECS CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2
```

### 3. Set Up Monitoring Dashboard

Access CloudWatch Dashboards in AWS Console to view:
- ECS service metrics
- ALB request metrics
- RDS database metrics
- Redis cache metrics

## Maintenance

### Update Services

To update a single service:

```bash
# Update service via ECS
aws ecs update-service \
    --cluster farlabs-cluster \
    --service farlabs-frontend \
    --force-new-deployment
```

### View Logs

```bash
# View service logs
aws logs tail /ecs/farlabs-frontend --follow

# View specific service logs
docker-compose logs -f frontend
```

### Scale Services

```bash
# Scale frontend service
aws ecs update-service \
    --cluster farlabs-cluster \
    --service farlabs-frontend \
    --desired-count 4
```

### Backup and Restore

```bash
# RDS automated backups are enabled with 7-day retention
# To create a manual snapshot:
aws rds create-db-snapshot \
    --db-instance-identifier farlabs-postgres \
    --db-snapshot-identifier farlabs-manual-snapshot-$(date +%Y%m%d)

# Redis snapshots are enabled with 5-day retention
```

## Troubleshooting

### ECS Tasks Not Starting

```bash
# Check task status
aws ecs describe-tasks \
    --cluster farlabs-cluster \
    --tasks $(aws ecs list-tasks --cluster farlabs-cluster --service-name farlabs-frontend --query 'taskArns[0]' --output text)

# Check CloudWatch logs
aws logs tail /ecs/farlabs-frontend --since 1h
```

### Database Connection Issues

```bash
# Verify security group rules
aws ec2 describe-security-groups \
    --group-ids <rds-security-group-id>

# Test connection from ECS task
# Exec into running task and test connection
```

### Redis Connection Issues

```bash
# Check ElastiCache cluster status
aws elasticache describe-cache-clusters \
    --cache-cluster-id farlabs-redis \
    --show-cache-node-info
```

## Cost Optimization

1. **Use Fargate Spot** for non-critical workloads
2. **Right-size RDS instance** based on actual usage
3. **Enable S3 lifecycle policies** for old logs
4. **Use CloudFront caching** for static assets
5. **Set up auto-scaling** for ECS services

## Security Best Practices

1. **Rotate secrets** regularly using AWS Secrets Manager rotation
2. **Enable AWS WAF** on ALB for DDoS protection
3. **Use VPC endpoints** for AWS services to avoid internet traffic
4. **Enable GuardDuty** for threat detection
5. **Regular security updates** for container images

## Disaster Recovery

1. **RDS**: Multi-AZ enabled, automated backups
2. **Redis**: Snapshot backups enabled
3. **Code**: Git repository backup
4. **Infrastructure**: Terraform state in S3 with versioning
5. **RPO**: 24 hours
6. **RTO**: 2-4 hours

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review ECS task events
3. Consult Far Labs documentation
4. Contact platform team

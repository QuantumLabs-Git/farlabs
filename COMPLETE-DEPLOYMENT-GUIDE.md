# Complete Deployment Guide - Far Labs

## Current Status

✅ **Infrastructure Deployed** - All AWS resources are live and operational
⏳ **Waiting for**: Docker images to be built and database initialization

## What You Need to Do

### Prerequisites
- Docker Desktop installed and running
- AWS CLI configured (already done ✓)
- Terminal access

## Step-by-Step Instructions

### Step 1: Start Docker Desktop

Docker Desktop needs to be running before proceeding.

**On macOS:**
1. Open **Finder**
2. Go to **Applications**
3. Find and double-click **Docker Desktop** (or Docker.app)
4. Wait for Docker to fully start (you'll see a whale icon in your menu bar)
5. Verify Docker is running:
   ```bash
   docker ps
   ```
   If you see a table (even if empty), Docker is ready!

**If you don't have Docker Desktop installed:**
- Download from: https://www.docker.com/products/docker-desktop/
- Install and start it

### Step 2: Run the Automated Deployment Script

Once Docker is running, execute:

```bash
cd /Volumes/PRO-G40/Development/Far\ Labs\ Codebase
./scripts/complete-deployment.sh
```

This script will automatically:
1. ✓ Verify Docker is running
2. ✓ Initialize the PostgreSQL database with schema
3. ✓ Login to Amazon ECR
4. ✓ Build all 7 Docker images
5. ✓ Push images to ECR
6. ✓ ECS will automatically deploy the services

**Expected duration:** 10-20 minutes depending on your machine and internet speed

### Step 3: Wait for ECS Services to Start

After images are pushed, ECS will automatically:
- Pull the images from ECR
- Start the containers
- Configure health checks
- Route traffic through the load balancer

This takes about **2-3 minutes**.

### Step 4: Verify Deployment

**Check if services are running:**
```bash
aws ecs list-services --cluster farlabs-cluster-free
```

**Check specific service status:**
```bash
aws ecs describe-services \
  --cluster farlabs-cluster-free \
  --services farlabs-frontend-free
```

**View service logs:**
```bash
# Frontend logs
aws logs tail /ecs/farlabs-frontend-free --follow

# API Gateway logs
aws logs tail /ecs/farlabs-api-gateway-free --follow

# Auth service logs
aws logs tail /ecs/farlabs-auth-free --follow
```

**Test the frontend:**
```bash
curl http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
```

Or open in browser:
```
http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
```

**Test the API:**
```bash
curl http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/health
```

## Manual Deployment (Alternative)

If you prefer to do it step-by-step manually:

### 1. Initialize Database

```bash
# Using Docker
docker run --rm \
  -v "$(pwd)/backend/database:/sql" \
  -e PGPASSWORD="FarLabs2025SecurePass!" \
  postgres:15 \
  psql -h farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com \
       -U farlabs_admin \
       -d farlabs \
       -f /sql/init.sql
```

### 2. Login to ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 894059646844.dkr.ecr.us-east-1.amazonaws.com
```

### 3. Build and Push Each Service

**Frontend:**
```bash
cd frontend
docker build -t farlabs-frontend-free:latest .
docker tag farlabs-frontend-free:latest 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-frontend-free:latest
docker push 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-frontend-free:latest
cd ..
```

**Auth Service:**
```bash
cd backend/services/auth
docker build -t farlabs-auth-free:latest .
docker tag farlabs-auth-free:latest 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-auth-free:latest
docker push 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-auth-free:latest
cd ../../..
```

**API Gateway:**
```bash
cd backend/api-gateway
docker build -t farlabs-api-gateway-free:latest .
docker tag farlabs-api-gateway-free:latest 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-api-gateway-free:latest
docker push 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-api-gateway-free:latest
cd ../..
```

**Payments Service:**
```bash
cd backend/services/payments
docker build -t farlabs-payments-free:latest .
docker tag farlabs-payments-free:latest 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-payments-free:latest
docker push 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-payments-free:latest
cd ../../..
```

**GPU Service:**
```bash
cd backend/services/gpu
docker build -t farlabs-gpu-free:latest .
docker tag farlabs-gpu-free:latest 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-gpu-free:latest
docker push 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-gpu-free:latest
cd ../../..
```

**Inference Service:**
```bash
cd backend/services/inference
docker build -t farlabs-inference-free:latest .
docker tag farlabs-inference-free:latest 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-inference-free:latest
docker push 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-inference-free:latest
cd ../../..
```

**Inference Worker:**
```bash
cd backend/services/inference_worker
docker build -t farlabs-inference-worker-free:latest .
docker tag farlabs-inference-worker-free:latest 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-inference-worker-free:latest
docker push 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-inference-worker-free:latest
cd ../../..
```

## Troubleshooting

### Docker Issues

**"Cannot connect to Docker daemon"**
- Ensure Docker Desktop is running
- Look for Docker whale icon in menu bar
- Try: `docker ps` to verify

**"Docker command not found"**
- Install Docker Desktop
- Restart terminal after installation

### Build Issues

**"npm install fails" (Frontend)**
- Check your internet connection
- Try: `npm cache clean --force`

**"pip install fails" (Backend services)**
- Check Python version in Dockerfile
- Verify requirements.txt exists

### ECS Issues

**Services not starting**
- Check logs: `aws logs tail /ecs/farlabs-frontend-free --follow`
- Verify images were pushed: `aws ecr describe-images --repository-name farlabs-frontend-free`

**"CannotPullContainerError"**
- Ensure images were pushed successfully
- Check ECR repository exists
- Verify ECS task role has ECR permissions

### Database Issues

**"Connection refused"**
- Check RDS instance is running: `aws rds describe-db-instances --db-instance-identifier farlabs-postgres-free`
- Verify security group allows connections from ECS

**"Schema already exists" error**
- This is OK - database was already initialized
- You can skip this step

## Infrastructure Details

### Services Deployed

| Service | Port | ECR Repository | Purpose |
|---------|------|----------------|---------|
| Frontend | 3000 | farlabs-frontend-free | Next.js UI |
| API Gateway | 8000 | farlabs-api-gateway-free | API routing |
| Auth | 8001 | farlabs-auth-free | Authentication |
| Payments | 8002 | farlabs-payments-free | Payment processing |
| GPU | 8003 | farlabs-gpu-free | GPU management |
| Inference | 8004 | farlabs-inference-free | AI inference |
| Inference Worker | - | farlabs-inference-worker-free | Background processing |

### Resources Created

- **ECS Cluster**: farlabs-cluster-free
- **Load Balancer**: farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
- **Database**: farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com
- **Redis**: farlabs-redis-free.b8rw3f.0001.use1.cache.amazonaws.com
- **VPC**: Custom VPC with 2 public subnets
- **S3 Buckets**:
  - farlabs-static-assets-894059646844
  - farlabs-model-storage-894059646844

### Cost Breakdown

| Resource | Type | Monthly Cost |
|----------|------|--------------|
| RDS PostgreSQL | db.t3.micro | ~$15 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| ECS Fargate | 7 services | FREE (750 hrs) |
| ALB | - | FREE (750 hrs) |
| ECR | 500MB storage | FREE |
| CloudWatch | 5GB logs | FREE |
| S3 | <5GB | FREE |
| **TOTAL** | | **~$27/month** |

## Next Steps After Deployment

1. **Set up DNS** (optional):
   - Point your domain to: farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
   - Configure SSL/TLS certificate in AWS Certificate Manager

2. **Configure monitoring**:
   - Set up CloudWatch alarms
   - Configure billing alerts

3. **Security enhancements**:
   - Change default passwords in terraform.tfvars
   - Rotate JWT secret
   - Enable RDS encryption (adds cost)

4. **Scaling** (when needed):
   - Increase ECS task counts
   - Upgrade RDS/Redis instance types
   - Add Multi-AZ for high availability

## Support & Documentation

- **Deployment Status**: See `DEPLOYMENT-STATUS.md`
- **Terraform Outputs**: `infra/terraform/outputs.json`
- **Database Schema**: `backend/database/init.sql`

## Quick Commands Reference

```bash
# Check all services
aws ecs list-services --cluster farlabs-cluster-free

# Restart a service
aws ecs update-service --cluster farlabs-cluster-free --service farlabs-frontend-free --force-new-deployment

# View logs
aws logs tail /ecs/farlabs-frontend-free --follow

# Check database
docker run --rm -it -e PGPASSWORD="FarLabs2025SecurePass!" postgres:15 \
  psql -h farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com -U farlabs_admin -d farlabs

# Test endpoints
curl http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
curl http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/health
```

---

**You're almost there!** Just start Docker Desktop and run the deployment script. The entire deployment will complete automatically in 10-20 minutes.

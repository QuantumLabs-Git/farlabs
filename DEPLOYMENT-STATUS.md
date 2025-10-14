# Far Labs Deployment Status

## Current Status: Infrastructure Deployed ✓

The AWS infrastructure has been successfully deployed! The platform is now running on AWS with free-tier optimized resources.

## Deployment Summary

**Date:** October 9, 2025
**AWS Account:** 894059646844
**Region:** us-east-1
**Total Resources Created:** 73

### Infrastructure Endpoints

- **Frontend URL:** http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
- **Load Balancer:** farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
- **RDS Endpoint:** farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com
- **Redis Endpoint:** farlabs-redis-free.b8rw3f.0001.use1.cache.amazonaws.com
- **ECS Cluster:** farlabs-cluster-free

### Resources Deployed

#### Networking (Free)
- ✓ VPC (10.0.0.0/16)
- ✓ 2 Public Subnets (us-east-1a, us-east-1b)
- ✓ Internet Gateway
- ✓ Route Tables
- ✓ Security Groups (ALB, ECS, RDS, Redis)

#### Compute (Free Tier - 750 hours/month)
- ✓ ECS Cluster (farlabs-cluster-free)
- ✓ 7 ECS Services running:
  - Frontend (Next.js)
  - API Gateway
  - Auth Service
  - Payments Service
  - GPU Service
  - Inference Service
  - Inference Worker
- ✓ ECS Task Definitions (256 CPU / 512 MB memory each)
- ✓ Application Load Balancer

#### Storage & Data
- ✓ RDS PostgreSQL 15.10 (db.t3.micro) - ~$15/month
  - Instance: farlabs-postgres-free
  - Database: farlabs
  - 20GB storage
  - Single-AZ

- ✓ ElastiCache Redis 7.0 (cache.t3.micro) - ~$12/month
  - Cluster: farlabs-redis-free
  - Single node

- ✓ S3 Buckets (Free Tier - 5GB storage)
  - farlabs-static-assets-894059646844
  - farlabs-model-storage-894059646844

#### Container Registry (Free)
- ✓ 7 ECR Repositories created:
  - farlabs-frontend-free
  - farlabs-api-gateway-free
  - farlabs-auth-free
  - farlabs-payments-free
  - farlabs-gpu-free
  - farlabs-inference-free
  - farlabs-inference-worker-free

#### Monitoring (Free)
- ✓ CloudWatch Log Groups (1 day retention)
- ✓ Service Discovery (AWS Cloud Map)

### Estimated Monthly Cost

**Total: ~$27/month**

Breakdown:
- RDS PostgreSQL (db.t3.micro): ~$15/month
- ElastiCache Redis (cache.t3.micro): ~$12/month
- ECS Fargate: FREE (within 750 hours/month free tier)
- ALB: FREE (within 750 hours/month free tier)
- ECR: FREE (500MB storage/month free tier)
- CloudWatch: FREE (5GB ingestion, 1 day retention)
- S3: FREE (within 5GB free tier)
- VPC, Networking: FREE

## Next Steps

### 1. Initialize Database Schema

The database needs to be initialized with the schema. Run one of these methods:

**Option A: Using Docker (Recommended)**
```bash
# Start Docker Desktop first
docker run --rm \
  -v "$(pwd)/backend/database:/sql" \
  -e PGPASSWORD="FarLabs2025SecurePass!" \
  postgres:15 \
  psql -h farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com \
  -U farlabs_admin -d farlabs -f /sql/init.sql
```

**Option B: Using local psql (if installed)**
```bash
PGPASSWORD="FarLabs2025SecurePass!" psql \
  -h farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com \
  -U farlabs_admin -d farlabs \
  -f backend/database/init.sql
```

### 2. Build and Push Docker Images

The ECS services are currently configured but need Docker images. Build and push them:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 894059646844.dkr.ecr.us-east-1.amazonaws.com

# Build and push all services
cd /Volumes/PRO-G40/Development/Far Labs Codebase

# Frontend
docker build -t farlabs-frontend-free:latest -f frontend/Dockerfile frontend/
docker tag farlabs-frontend-free:latest 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-frontend-free:latest
docker push 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-frontend-free:latest

# Auth Service
docker build -t farlabs-auth-free:latest -f backend/auth/Dockerfile backend/auth/
docker tag farlabs-auth-free:latest 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-auth-free:latest
docker push 894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-auth-free:latest

# Repeat for other services...
```

### 3. Update ECS Services

After pushing images, ECS services will automatically pull the latest images and start running.

### 4. Verify Deployment

Test the endpoints:

```bash
# Check frontend (may take a few minutes after images are pushed)
curl http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com

# Check API Gateway
curl http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/health
```

## Current Limitations

**No Docker Images Deployed Yet**
- Infrastructure is deployed and ready
- ECS services are created but waiting for Docker images
- Services will start automatically once images are pushed to ECR

**Database Not Initialized**
- PostgreSQL instance is running
- Schema needs to be initialized (see step 1 above)
- Tables: users, payment_balances, payment_transactions, staking_positions, staking_history, gpu_nodes, inference_tasks

## Connection Details

### Database Connection
```
Host: farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com
Port: 5432
Database: farlabs
Username: farlabs_admin
Password: FarLabs2025SecurePass!
Connection String: postgresql://farlabs_admin:FarLabs2025SecurePass!@farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:5432/farlabs
```

### Redis Connection
```
Host: farlabs-redis-free.b8rw3f.0001.use1.cache.amazonaws.com
Port: 6379
```

### Environment Variables for Services
All ECS services have been configured with these environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: redis://farlabs-redis-free.b8rw3f.0001.use1.cache.amazonaws.com:6379
- `JWT_SECRET_KEY`: your-secret-key-change-in-production
- Service-specific URLs for inter-service communication

## Monitoring

### CloudWatch Logs
View logs for each service:
```bash
aws logs tail /ecs/farlabs-frontend-free --follow
aws logs tail /ecs/farlabs-auth-free --follow
aws logs tail /ecs/farlabs-api-gateway-free --follow
# etc...
```

### ECS Service Status
```bash
aws ecs list-services --cluster farlabs-cluster-free
aws ecs describe-services --cluster farlabs-cluster-free --services farlabs-frontend-free
```

## Cleanup (When Needed)

To destroy all resources and stop incurring costs:

```bash
cd infra/terraform
terraform destroy -auto-approve
```

This will remove all AWS resources. Note: RDS and Redis are the only resources incurring costs (~$27/month).

## Architecture Notes

**Free-Tier Optimizations Applied:**
- Public subnets only (no NAT Gateway saves $90/month)
- Minimal task resources (256 CPU / 512 MB memory)
- Single instances per service
- 1-day log retention
- No encryption on RDS (avoids KMS costs)
- Single-AZ deployment
- Container Insights disabled

**Security Considerations:**
- Services run in public subnets with security groups
- Database is not publicly accessible
- Redis is not publicly accessible
- Only ALB accepts traffic from internet
- Services communicate internally via security groups

## Support

For issues or questions:
- Check CloudWatch logs for service errors
- Verify security group rules if services can't communicate
- Ensure Docker images are properly pushed to ECR
- Database initialization must complete before services can connect

---

**Deployment completed successfully on October 9, 2025**

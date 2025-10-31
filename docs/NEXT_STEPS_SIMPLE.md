# Next Steps to Get Everything Working

## Current Status
- ✅ Frontend built and in ECR
- ✅ GPU Worker built and in ECR
- ✅ Auth service running in production
- ❌ Database migration blocked (network access issue from EC2)
- ❌ Far Mesh Coordinator needs to be built and deployed

## Simplified Path Forward (30 minutes)

### Step 1: Build Far Mesh Coordinator Without Migration (5 min)

Skip the database migration during build, apply it later from ECS where it has proper database access.

```bash
# Build and push Far Mesh Coordinator directly
ssh ec2-user@18.232.57.77 'bash -s' <<'REMOTE'
set -e
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SERVICE_NAME="farlabs-far-mesh-coordinator-free"

echo "[1/3] Creating ECR repository..."
aws ecr describe-repositories --repository-names "$SERVICE_NAME" --region "$AWS_REGION" 2>/dev/null || \
aws ecr create-repository --repository-name "$SERVICE_NAME" --region "$AWS_REGION"

echo "[2/3] Building Docker image..."
cd /home/ec2-user/backend/services/far_mesh_coordinator
docker build -t "$SERVICE_NAME:latest" .
docker tag "$SERVICE_NAME:latest" "$ECR_REGISTRY/$SERVICE_NAME:latest"

echo "[3/3] Pushing to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker push "$ECR_REGISTRY/$SERVICE_NAME:latest"
echo "✓ Done!"
REMOTE
```

### Step 2: Apply Database Migration Directly (2 min)

Use an ECS task that has proper VPC/security group access:

```bash
# Create a one-time migration task
aws ecs run-task \
  --cluster farlabs-cluster-free \
  --task-definition farlabs-auth-free \
  --overrides '{
    "containerOverrides": [{
      "name": "auth",
      "command": ["bash", "-c", "
        apt-get update && apt-get install -y postgresql-client && \
        psql postgresql://farlabs_admin:FarLabs2025SecurePass!@farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com/farlabs < /migrations/004_distributed_inference.sql
      "]
    }]
  }' \
  --region us-east-1
```

**OR** simpler - apply it manually via psql from your local machine or any machine that can reach RDS.

### Step 3: Deploy Far Mesh Coordinator to ECS (15 min)

```bash
# Get subnet and security group IDs from existing auth service
SUBNET_ID=$(aws ecs describe-services \
  --cluster farlabs-cluster-free \
  --services farlabs-auth-service-free \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.subnets[0]' \
  --output text)

SECURITY_GROUP=$(aws ecs describe-services \
  --cluster farlabs-cluster-free \
  --services farlabs-auth-service-free \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups[0]' \
  --output text)

# Create task definition
cat > /tmp/far-mesh-coordinator-task.json << 'EOF'
{
  "family": "farlabs-far-mesh-coordinator-free",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::894059646844:role/ecsTaskExecutionRole",
  "containerDefinitions": [{
    "name": "coordinator",
    "image": "894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-far-mesh-coordinator-free:latest",
    "portMappings": [{"containerPort": 8003, "protocol": "tcp"}],
    "environment": [
      {"name": "PORT", "value": "8003"},
      {"name": "DATABASE_URL", "value": "postgresql://farlabs_admin:FarLabs2025SecurePass!@farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com/farlabs"},
      {"name": "MODEL_ID", "value": "meta-llama/Llama-2-7b-chat-hf"},
      {"name": "DHT_BOOTSTRAP_ADDR", "value": "/ip4/farmesh.dev/tcp/31337"},
      {"name": "PRICE_PER_TOKEN_FAR", "value": "0.0001"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/farlabs-far-mesh-coordinator-free",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs",
        "awslogs-create-group": "true"
      }
    }
  }]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file:///tmp/far-mesh-coordinator-task.json

# Create service
aws ecs create-service \
  --cluster farlabs-cluster-free \
  --service-name farlabs-far-mesh-coordinator-free \
  --task-definition farlabs-far-mesh-coordinator-free \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SECURITY_GROUP],assignPublicIp=ENABLED}"
```

### Step 4: Add ALB Target Group & Listener Rule (5 min)

```bash
# Get ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names farlabs-alb-free \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Get VPC ID
VPC_ID=$(aws elbv2 describe-load-balancers \
  --names farlabs-alb-free \
  --query 'LoadBalancers[0].VpcId' \
  --output text)

# Create target group for port 8003
TG_ARN=$(aws elbv2 create-target-group \
  --name farlabs-coordinator-tg \
  --protocol HTTP \
  --port 8003 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Get listener ARN (port 80)
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query 'Listeners[?Port==`80`].ListenerArn' \
  --output text)

# Add rule for /api/inference/* -> coordinator
aws elbv2 create-rule \
  --listener-arn $LISTENER_ARN \
  --priority 3 \
  --conditions Field=path-pattern,Values='/api/inference/*' \
  --actions Type=forward,TargetGroupArn=$TG_ARN

# Update ECS service with target group
aws ecs update-service \
  --cluster farlabs-cluster-free \
  --service farlabs-far-mesh-coordinator-free \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=coordinator,containerPort=8003"
```

### Step 5: Test It Works (3 min)

```bash
# Test health endpoint
curl http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/inference/health

# Test inference (with a valid auth token)
curl -X POST http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/inference/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "Hello, how are you?",
    "max_tokens": 50,
    "request_id": "test-001"
  }'
```

---

## Alternative: Even Simpler "Get It Working" Path

### If you just want to see distributed inference working ASAP:

1. **Skip Far Mesh for now**, deploy the regular Inference service first (already building)
2. **Test single-GPU inference** - verify the whole stack works
3. **Then add Far Mesh** as an enhancement

This gets you:
- ✅ Working inference API in ~5 minutes
- ✅ Proof that everything integrates
- ✅ Can test auth, payments, frontend
- Then add distributed inference after validation

### Commands for "Just Get Inference Working":

```bash
# Wait for inference service build to complete, then:

# 1. Create task definition for regular inference
# 2. Deploy to ECS
# 3. Add to ALB
# 4. Test

# This is the FASTEST path to a working system
```

---

## What's Actually Needed for MVP

For a truly minimal viable product:

### Must Have (Week 1):
1. ✅ Auth service (working)
2. ✅ Frontend (built, needs deployment)
3. ⏳ **Inference API** (either single-GPU OR distributed)
4. ⏳ Database with sessions table

### Nice to Have (Week 2-3):
5. GPU provider registration
6. Payment tracking
7. Provider dashboard

### Can Wait (Week 4):
8. Actual blockchain payments
9. Multiple GPU providers
10. Advanced monitoring

---

## My Recommendation

**Option A: Fastest to "working system" (30 min)**
Deploy regular inference service → Test end-to-end → Add distributed later

**Option B: Go straight to distributed (60 min)**
Finish Far Mesh Coordinator → Deploy → May hit issues with FarMesh network discovery

I'd recommend **Option A** - get a working system first, then enhance it. What do you think?

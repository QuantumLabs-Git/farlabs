#!/bin/bash
# Deploy Far Mesh Coordinator Service
set -e

echo "================================================"
echo "Far Mesh Coordinator - Deployment Script"
echo "================================================"
echo ""

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SERVICE_NAME="farlabs-far-mesh-coordinator-free"

# Database connection details
DB_HOST="farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com"
DB_USER="farlabs_admin"
DB_NAME="farlabs"
DB_PASSWORD="FarLabs2025SecurePass!"

echo "[1/5] Applying database migration..."
echo ""
export PGPASSWORD="$DB_PASSWORD"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f backend/database/migrations/004_distributed_inference.sql
echo "✓ Database migration applied"
echo ""

echo "[2/5] Creating ECR repository..."
aws ecr describe-repositories --repository-names "$SERVICE_NAME" --region "$AWS_REGION" 2>/dev/null || \
aws ecr create-repository --repository-name "$SERVICE_NAME" --region "$AWS_REGION"
echo "✓ ECR repository ready"
echo ""

echo "[3/5] Building Docker image..."
cd backend/services/far_mesh_coordinator
docker build -t "$SERVICE_NAME:latest" .
docker tag "$SERVICE_NAME:latest" "$ECR_REGISTRY/$SERVICE_NAME:latest"
cd ../../..
echo "✓ Image built"
echo ""

echo "[4/5] Logging into ECR and pushing image..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker push "$ECR_REGISTRY/$SERVICE_NAME:latest"
echo "✓ Image pushed to ECR"
echo ""

echo "[5/5] Creating ECS task definition..."

# Create task definition JSON
cat > /tmp/far-mesh-coordinator-task-def.json << EOF
{
  "family": "$SERVICE_NAME",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "far-mesh-coordinator",
      "image": "${ECR_REGISTRY}/${SERVICE_NAME}:latest",
      "portMappings": [
        {
          "containerPort": 8003,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "PORT", "value": "8003"},
        {"name": "DATABASE_URL", "value": "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}"},
        {"name": "MODEL_ID", "value": "meta-llama/Llama-2-7b-chat-hf"},
        {"name": "DHT_BOOTSTRAP_ADDR", "value": "/ip4/farmesh.dev/tcp/31337"},
        {"name": "PRICE_PER_TOKEN_FAR", "value": "0.0001"},
        {"name": "COORDINATOR_PORT", "value": "8003"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${SERVICE_NAME}",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
      "essential": true
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file:///tmp/far-mesh-coordinator-task-def.json --region "$AWS_REGION"
echo "✓ Task definition registered"
echo ""

echo "================================================"
echo "Next Steps:"
echo "================================================"
echo ""
echo "1. Create ECS service:"
echo "   aws ecs create-service \\"
echo "     --cluster farlabs-cluster-free \\"
echo "     --service-name $SERVICE_NAME \\"
echo "     --task-definition $SERVICE_NAME \\"
echo "     --desired-count 1 \\"
echo "     --launch-type FARGATE \\"
echo "     --network-configuration 'awsvpcConfiguration={subnets=[subnet-XXXXX],securityGroups=[sg-XXXXX],assignPublicIp=ENABLED}' \\"
echo "     --region $AWS_REGION"
echo ""
echo "2. Add target to ALB for port 8003"
echo ""
echo "3. Configure security group to allow port 31337 (DHT) and 8003 (HTTP)"
echo ""

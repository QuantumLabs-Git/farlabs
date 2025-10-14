#!/bin/bash
set -e

# Far Labs - Build and Push Docker Images (Free Tier)
# This script builds and pushes all Docker images to ECR

echo "================================================"
echo "Far Labs - Build and Push Docker Images"
echo "================================================"
echo ""

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo ""

# Login to ECR
echo "Step 1: Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "✓ Logged in to ECR"
echo ""

# Define services
SERVICES=(
    "frontend:frontend"
    "api-gateway:backend/api-gateway"
    "auth:backend/services/auth"
    "payments:backend/services/payments"
    "inference:backend/services/inference"
    "inference-worker:backend/services/inference_worker"
    "gpu:backend/services/gpu"
)

# Build and push each service
for SERVICE in "${SERVICES[@]}"; do
    IFS=':' read -r NAME PATH <<< "$SERVICE"

    echo "================================================"
    echo "Building $NAME..."
    echo "================================================"

    IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/farlabs-$NAME-free:latest"

    # Build
    echo "Building Docker image from $PATH..."
    docker build --platform linux/amd64 -f $PATH/Dockerfile $PATH -t $IMAGE_URI

    # Push
    echo "Pushing to ECR..."
    docker push $IMAGE_URI

    echo "✓ $NAME complete"
    echo ""
done

echo "================================================"
echo "All Images Built and Pushed!"
echo "================================================"
echo ""

echo "Updating ECS services to use new images..."
echo ""

# Update ECS services
ECS_SERVICES=(
    "farlabs-frontend-free"
    "farlabs-api-free"
    "farlabs-auth-free"
    "farlabs-payments-free"
    "farlabs-inference-free"
    "farlabs-inference-worker-free"
    "farlabs-gpu-free"
)

for SERVICE in "${ECS_SERVICES[@]}"; do
    echo "Updating $SERVICE..."
    aws ecs update-service \
        --cluster farlabs-cluster-free \
        --service $SERVICE \
        --force-new-deployment \
        --region $AWS_REGION \
        > /dev/null 2>&1 || echo "  (Service may not exist yet)"
done

echo ""
echo "✓ All services updated!"
echo ""

# Get ALB DNS
cd infra/terraform
ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "N/A")
cd ../..

echo "Your application will be available at:"
echo "  Frontend: http://$ALB_DNS"
echo "  API: http://$ALB_DNS/healthz"
echo ""
echo "Note: It may take 2-3 minutes for services to become healthy."
echo ""
echo "Check service status:"
echo "  aws ecs describe-services --cluster farlabs-cluster-free --services farlabs-frontend-free"
echo ""

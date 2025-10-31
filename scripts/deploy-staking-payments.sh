#!/bin/bash
# Deploy Staking and Payments Services

set -e

REGION="us-east-1"
ACCOUNT_ID="894059646844"
CLUSTER="farlabs-cluster-free"

echo "=========================================="
echo "Deploying Staking and Payments Services"
echo "=========================================="
echo ""

# Login to ECR
echo "1. Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
echo "   ✓ Logged in"
echo ""

# Build and push Staking service
echo "2. Building staking service..."
cd backend
docker build --platform linux/amd64 -f services/staking/Dockerfile -t farlabs-staking-free:latest .
docker tag farlabs-staking-free:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/farlabs-staking-free:latest
echo "   ✓ Built"
echo ""

echo "3. Pushing staking service..."
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/farlabs-staking-free:latest
echo "   ✓ Pushed"
echo ""

# Build and push Payments service
echo "4. Building payments service..."
docker build --platform linux/amd64 -f services/payments/Dockerfile -t farlabs-payments-free:latest .
docker tag farlabs-payments-free:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/farlabs-payments-free:latest
echo "   ✓ Built"
echo ""

echo "5. Pushing payments service..."
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/farlabs-payments-free:latest
echo "   ✓ Pushed"
echo ""

cd ..

# Update ECS services
echo "6. Updating ECS services..."
echo "   Updating staking service..."
aws ecs update-service \
    --cluster $CLUSTER \
    --service farlabs-staking-free \
    --force-new-deployment \
    --region $REGION \
    --desired-count 1 \
    --query 'service.{Service:serviceName,Status:status}' \
    --output json

echo ""
echo "   Updating payments service..."
aws ecs update-service \
    --cluster $CLUSTER \
    --service farlabs-payments-free \
    --force-new-deployment \
    --region $REGION \
    --desired-count 1 \
    --query 'service.{Service:serviceName,Status:status}' \
    --output json

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Services are updating. Wait 1-2 minutes for tasks to start."
echo ""
echo "To check status:"
echo "  aws ecs describe-services --cluster $CLUSTER --services farlabs-staking-free farlabs-payments-free --region $REGION"
echo ""
echo "To view logs:"
echo "  aws logs tail /ecs/farlabs-staking-free --follow --region $REGION"
echo "  aws logs tail /ecs/farlabs-payments-free --follow --region $REGION"
echo ""

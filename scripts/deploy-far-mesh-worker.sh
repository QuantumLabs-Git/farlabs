#!/bin/bash
set -e

echo "================================================"
echo "Far Mesh Worker - Build & Deploy to ECR"
echo "================================================"
echo ""

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SERVICE_NAME="farlabs-far-mesh-worker-free"
BUILD_EC2_IP="3.94.113.76"
SSH_KEY="$HOME/.ssh/farlabs-deploy-key.pem"

echo "[1/4] Copying Far Mesh Worker files to EC2 build server..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" ec2-user@${BUILD_EC2_IP} "mkdir -p /home/ec2-user/far_mesh_worker_build"
rsync -avz -e "ssh -o StrictHostKeyChecking=no -i $SSH_KEY" \
  backend/services/far_mesh_worker/ \
  ec2-user@${BUILD_EC2_IP}:/home/ec2-user/far_mesh_worker_build/
echo "✓ Files copied"
echo ""

echo "[2/4] Creating ECR repository if it doesn't exist..."
aws ecr describe-repositories --repository-names "$SERVICE_NAME" --region "$AWS_REGION" 2>/dev/null || \
  aws ecr create-repository --repository-name "$SERVICE_NAME" --region "$AWS_REGION" --no-cli-pager
echo "✓ ECR repository ready"
echo ""

echo "[3/4] Building Docker image on EC2..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" ec2-user@${BUILD_EC2_IP} bash <<'REMOTE'
set -e

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SERVICE_NAME="farlabs-far-mesh-worker-free"

echo "Checking disk space..."
df -h /
echo ""

cd /home/ec2-user/far_mesh_worker_build

echo "Building Docker image..."
docker build -t "$SERVICE_NAME:latest" .
echo "✓ Image built"
echo ""

echo "Tagging image..."
docker tag "$SERVICE_NAME:latest" "$ECR_REGISTRY/$SERVICE_NAME:latest"
echo "✓ Image tagged"
echo ""

echo "Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY" > /dev/null 2>&1
echo "✓ Logged into ECR"
echo ""

echo "Pushing to ECR..."
docker push "$ECR_REGISTRY/$SERVICE_NAME:latest"
echo "✓ Image pushed to ECR"
echo ""
REMOTE

echo ""
echo "[4/4] Verifying image in ECR..."
aws ecr describe-images --repository-name "$SERVICE_NAME" --region "$AWS_REGION" --query 'imageDetails[0].imageTags' --output text
echo ""

echo "================================================"
echo "✓ Far Mesh Worker successfully deployed to ECR!"
echo "================================================"
echo ""
echo "Docker image: ${ECR_REGISTRY}/${SERVICE_NAME}:latest"
echo ""

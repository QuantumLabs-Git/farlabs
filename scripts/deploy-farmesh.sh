#!/bin/bash
set -e

echo "================================================"
echo "Far Mesh Coordinator - Build with Latest Petals"
echo "================================================"
echo ""

# Configuration
EC2_HOST="34.239.181.168"
EC2_USER="ec2-user"
SSH_KEY="$HOME/.ssh/farlabs-deploy-key.pem"
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SERVICE_NAME="farlabs-far-mesh-coordinator-free"

cd "/Volumes/PRO-G40/Development/Far Labs Codebase"

# Step 1: Copy updated code to EC2
echo "[1/4] Copying updated Far Mesh Coordinator code to EC2..."
rsync -avz --delete \
  -e "ssh -o StrictHostKeyChecking=no -i $SSH_KEY" \
  backend/services/far_mesh_coordinator/ \
  ${EC2_USER}@${EC2_HOST}:/home/ec2-user/far_mesh_build/
echo "✓ Code copied"
echo ""

# Step 2: Build and push on EC2
echo "[2/4] Building Docker image on EC2..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} bash <<'REMOTE'
set -e

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SERVICE_NAME="farlabs-far-mesh-coordinator-free"

cd /home/ec2-user/far_mesh_build

echo "Building Docker image..."
docker build -t "$SERVICE_NAME:latest" .
docker tag "$SERVICE_NAME:latest" "$ECR_REGISTRY/$SERVICE_NAME:latest"
echo "✓ Image built"
echo ""

echo "Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY" > /dev/null 2>&1
echo "✓ Logged into ECR"
echo ""

echo "Pushing image to ECR..."
docker push "$ECR_REGISTRY/$SERVICE_NAME:latest"
echo "✓ Image pushed to ECR"
REMOTE

echo "✓ Docker image built and pushed"
echo ""

echo "================================================"
echo "✓ Far Mesh Coordinator ready for deployment!"
echo "================================================"

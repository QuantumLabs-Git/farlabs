#!/bin/bash
set -e

# Far Node Server - Deployment Script
# Builds and pushes the GPU provider client Docker image to ECR

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SERVICE_NAME="farlabs-far-node-server"
BUILD_HOST="ec2-user@18.232.57.77"
SSH_KEY="$HOME/.ssh/farlabs-deploy-key.pem"

echo "================================================"
echo "Far Node Server - Deployment to ECR"
echo "================================================"
echo ""
echo "This builds the downloadable Far Node Server"
echo "that GPU providers run on their machines."
echo ""

# Create ECR repository if it doesn't exist
echo "[1/5] Creating ECR repository..."
aws ecr describe-repositories --repository-names "$SERVICE_NAME" --region "$AWS_REGION" 2>/dev/null || \
aws ecr create-repository \
  --repository-name "$SERVICE_NAME" \
  --region "$AWS_REGION" \
  --no-cli-pager
echo "✓ ECR repository ready"
echo ""

# Copy files to build server
echo "[2/5] Copying files to build server..."
rsync -avz --delete \
  -e "ssh -o StrictHostKeyChecking=no -i $SSH_KEY" \
  --exclude='*.pyc' \
  --exclude='__pycache__' \
  --exclude='.env' \
  backend/services/far_node_server/ \
  "${BUILD_HOST}:/home/ec2-user/far_node_server_build/"
echo "✓ Files copied"
echo ""

# Build and push on remote server
echo "[3/5] Building Docker image on remote server..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$BUILD_HOST" 'bash -s' <<REMOTE
set -e

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="\${AWS_ACCOUNT_ID}.dkr.ecr.\${AWS_REGION}.amazonaws.com"
SERVICE_NAME="farlabs-far-node-server"

echo "Building Docker image (this will take 10-15 minutes due to PyTorch and FarMesh)..."
cd /home/ec2-user/far_node_server_build
docker build -t "\${SERVICE_NAME}:latest" .
echo "✓ Image built"
echo ""

echo "Tagging image..."
docker tag "\${SERVICE_NAME}:latest" "\${ECR_REGISTRY}/\${SERVICE_NAME}:latest"
echo "✓ Image tagged"
REMOTE

echo "✓ Docker image built"
echo ""

echo "[4/5] Logging into ECR..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$BUILD_HOST" 'bash -s' <<REMOTE
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="\${AWS_ACCOUNT_ID}.dkr.ecr.\${AWS_REGION}.amazonaws.com"

aws ecr get-login-password --region "\${AWS_REGION}" | \
  docker login --username AWS --password-stdin "\${ECR_REGISTRY}" > /dev/null 2>&1
echo "✓ Logged into ECR"
REMOTE

echo "✓ Logged into ECR"
echo ""

echo "[5/5] Pushing image to ECR..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$BUILD_HOST" 'bash -s' <<REMOTE
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="\${AWS_ACCOUNT_ID}.dkr.ecr.\${AWS_REGION}.amazonaws.com"
SERVICE_NAME="farlabs-far-node-server"

docker push "\${ECR_REGISTRY}/\${SERVICE_NAME}:latest"
echo "✓ Image pushed to ECR"
REMOTE

echo "✓ Image pushed to ECR"
echo ""

echo "================================================"
echo "✓ Far Node Server Deployment Complete!"
echo "================================================"
echo ""
echo "Docker image available at:"
echo "${ECR_REGISTRY}/${SERVICE_NAME}:latest"
echo ""
echo "GPU providers can now download and run this image"
echo "to participate in the Far Mesh network."
echo ""

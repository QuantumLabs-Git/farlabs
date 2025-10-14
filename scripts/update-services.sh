#!/bin/bash

# Far Labs - Update Services (Frontend + Inference)
# Rebuilds and redeploys specific services without recreating infrastructure

set -e

echo "================================================"
echo "Far Labs - Service Update"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
CLUSTER_NAME="farlabs-cluster-free"

# Get VPC and Subnet from Terraform
cd "$(dirname "$0")/../infra/terraform"
SUBNET_ID=$(terraform output -json | jq -r '.public_subnet_ids.value[0]')
VPC_ID=$(aws ec2 describe-subnets --subnet-ids ${SUBNET_ID} --query 'Subnets[0].VpcId' --output text)

echo -e "${BLUE}VPC: ${VPC_ID}${NC}"
echo -e "${BLUE}Subnet: ${SUBNET_ID}${NC}"
echo ""

# Find or create security group
echo -e "${BLUE}[1/6] Setting up security group...${NC}"
SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=farlabs-build-sg" "Name=vpc-id,Values=${VPC_ID}" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
    echo "Creating new security group..."
    SG_ID=$(aws ec2 create-security-group \
        --group-name farlabs-build-sg \
        --description "Temporary SG for build instance" \
        --vpc-id ${VPC_ID} \
        --query 'GroupId' \
        --output text)

    # Allow SSH
    aws ec2 authorize-security-group-ingress \
        --group-id ${SG_ID} \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0 2>/dev/null || true
fi

echo -e "${GREEN}✓ Security group: ${SG_ID}${NC}"
echo ""

# Check for SSH key
echo -e "${BLUE}[2/6] Checking SSH key...${NC}"
KEY_NAME="farlabs-deploy-key"
if ! aws ec2 describe-key-pairs --key-names ${KEY_NAME} &>/dev/null; then
    echo "Creating SSH key pair..."
    aws ec2 create-key-pair --key-name ${KEY_NAME} --query 'KeyMaterial' --output text > ~/.ssh/${KEY_NAME}.pem
    chmod 400 ~/.ssh/${KEY_NAME}.pem
fi
echo -e "${GREEN}✓ SSH key ready${NC}"
echo ""

# Launch EC2 instance
echo -e "${BLUE}[3/6] Launching build instance (t3.medium)...${NC}"
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0453ec754f44f9a4a \
    --instance-type t3.medium \
    --key-name ${KEY_NAME} \
    --security-group-ids ${SG_ID} \
    --subnet-id ${SUBNET_ID} \
    --associate-public-ip-address \
    --iam-instance-profile Name=farlabs-ec2-build-profile \
    --user-data '#!/bin/bash
yum update -y
yum install -y docker git
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user' \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=farlabs-update-instance}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo -e "${GREEN}✓ Instance: ${INSTANCE_ID}${NC}"
echo ""

# Wait for instance
echo -e "${BLUE}[4/6] Waiting for instance to start...${NC}"
aws ec2 wait instance-running --instance-ids ${INSTANCE_ID}
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids ${INSTANCE_ID} --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo -e "${GREEN}✓ Instance running at ${PUBLIC_IP}${NC}"
echo ""

# Wait for SSH
echo -e "${BLUE}[5/6] Waiting for SSH (this may take 2-3 minutes)...${NC}"
for i in {1..30}; do
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} "echo ready" &>/dev/null; then
        echo -e "${GREEN}✓ SSH ready${NC}"
        break
    fi
    echo "Attempt ${i}/30..."
    sleep 10
done
echo ""

# Upload source code
echo -e "${BLUE}[6/6] Building and pushing images...${NC}"
echo "Uploading source code..."

cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# Create tarball of only what we need
tar czf /tmp/farlabs-update.tar.gz \
    frontend/ \
    backend/services/inference/ \
    backend/common/ \
    --exclude=node_modules \
    --exclude=__pycache__ \
    --exclude=.next \
    --exclude=dist \
    --exclude=build

scp -o StrictHostKeyChecking=no -i ~/.ssh/${KEY_NAME}.pem /tmp/farlabs-update.tar.gz ec2-user@${PUBLIC_IP}:/tmp/
ssh -o StrictHostKeyChecking=no -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} "mkdir -p /home/ec2-user/build && cd /home/ec2-user/build && tar xzf /tmp/farlabs-update.tar.gz"

echo -e "${GREEN}✓ Source uploaded${NC}"
echo ""
echo -e "${YELLOW}Building Docker images (15-20 minutes)...${NC}"
echo ""

# Build on EC2
ssh -o StrictHostKeyChecking=no -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} bash <<'REMOTE'
set -e

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

cd /home/ec2-user/build

# Build frontend
echo ""
echo "======================================"
echo "Building Frontend (Next.js 14)"
echo "======================================"
cd frontend
docker build -t farlabs-frontend-free:latest .
docker tag farlabs-frontend-free:latest ${ECR_REGISTRY}/farlabs-frontend-free:latest
docker push ${ECR_REGISTRY}/farlabs-frontend-free:latest
echo "✓ Frontend pushed"
cd ..

# Build inference service
echo ""
echo "======================================"
echo "Building Inference Service"
echo "======================================"
echo "This will take 10-15 minutes due to PyTorch/transformers..."
cd backend/services/inference
docker build -t farlabs-inference-free:latest .
docker tag farlabs-inference-free:latest ${ECR_REGISTRY}/farlabs-inference-free:latest
docker push ${ECR_REGISTRY}/farlabs-inference-free:latest
echo "✓ Inference service pushed"
cd ../../..

echo ""
echo "======================================"
echo "✓ All images built and pushed!"
echo "======================================"
REMOTE

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Images built and pushed successfully!${NC}"
else
    echo ""
    echo -e "${RED}✗ Build failed${NC}"
    echo "SSH to instance to debug: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
    exit 1
fi

echo ""
echo -e "${BLUE}Updating ECS services...${NC}"

# Force new deployment for frontend
echo "Updating frontend service..."
aws ecs update-service \
    --cluster ${CLUSTER_NAME} \
    --service farlabs-frontend-free \
    --force-new-deployment \
    --output text > /dev/null
echo -e "${GREEN}✓ Frontend service updating${NC}"

# Force new deployment for inference service
echo "Updating inference service..."
aws ecs update-service \
    --cluster ${CLUSTER_NAME} \
    --service farlabs-inference-free \
    --force-new-deployment \
    --output text > /dev/null
echo -e "${GREEN}✓ Inference service updating${NC}"

echo ""
echo -e "${BLUE}Cleaning up...${NC}"
read -p "Terminate build instance? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    aws ec2 terminate-instances --instance-ids ${INSTANCE_ID} > /dev/null
    echo -e "${GREEN}✓ Instance terminating${NC}"
else
    echo -e "${YELLOW}Instance left running: ${INSTANCE_ID} at ${PUBLIC_IP}${NC}"
    echo "Terminate manually: aws ec2 terminate-instances --instance-ids ${INSTANCE_ID}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Update Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Services are redeploying with new images."
echo "This will take 3-5 minutes."
echo ""
echo "Check status:"
echo "  aws ecs describe-services --cluster ${CLUSTER_NAME} --services farlabs-frontend-free farlabs-inference-free"
echo ""
echo "View logs:"
echo "  aws logs tail /ecs/farlabs-frontend-free --follow"
echo "  aws logs tail /ecs/farlabs-inference-free --follow"
echo ""
echo "Frontend URL: http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"
echo ""

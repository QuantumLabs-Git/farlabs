#!/bin/bash

# Far Labs - EC2-Based Deployment
# This script creates a temporary EC2 instance that builds and pushes all Docker images
# No local Docker required!

set -e

echo "================================================"
echo "Far Labs - Cloud-Based Deployment"
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
KEY_NAME="farlabs-deploy-key"
INSTANCE_TYPE="t3.medium"  # Free tier: t2.micro, but t3.medium is faster
AMI_ID="ami-0453ec754f44f9a4a"  # Amazon Linux 2023 in us-east-1

# Get VPC and Subnet from Terraform outputs
cd "$(dirname "$0")/../infra/terraform"
VPC_ID=$(terraform output -json | jq -r '.public_subnet_ids.value[0]' | cut -d'-' -f1-2)
SUBNET_ID=$(terraform output -json | jq -r '.public_subnet_ids.value[0]')
RDS_ENDPOINT=$(terraform output -json | jq -r '.rds_endpoint.value')

echo -e "${BLUE}Using Subnet: ${SUBNET_ID}${NC}"
echo ""

# Get VPC ID
VPC_ID=$(aws ec2 describe-subnets --subnet-ids ${SUBNET_ID} --query 'Subnets[0].VpcId' --output text)

# Create security group for build instance
echo -e "${BLUE}[1/8] Creating security group...${NC}"
SG_ID=$(aws ec2 create-security-group \
    --group-name farlabs-build-sg \
    --description "Temporary SG for build instance" \
    --vpc-id ${VPC_ID} \
    --query 'GroupId' \
    --output text 2>/dev/null || aws ec2 describe-security-groups --filters "Name=group-name,Values=farlabs-build-sg" --query 'SecurityGroups[0].GroupId' --output text)

# Allow SSH access from anywhere (for uploading code)
aws ec2 authorize-security-group-ingress \
    --group-id ${SG_ID} \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 2>/dev/null || true

# Allow outbound internet access (should be default, but making sure)
aws ec2 authorize-security-group-egress \
    --group-id ${SG_ID} \
    --protocol -1 \
    --cidr 0.0.0.0/0 2>/dev/null || true

echo -e "${GREEN}✓ Security group: ${SG_ID}${NC}"
echo ""

# Create key pair if it doesn't exist
echo -e "${BLUE}[2/8] Setting up SSH key...${NC}"
if ! aws ec2 describe-key-pairs --key-names ${KEY_NAME} &>/dev/null; then
    aws ec2 create-key-pair --key-name ${KEY_NAME} --query 'KeyMaterial' --output text > ~/.ssh/${KEY_NAME}.pem
    chmod 400 ~/.ssh/${KEY_NAME}.pem
    echo -e "${GREEN}✓ Created new key pair${NC}"
else
    echo -e "${GREEN}✓ Using existing key pair${NC}"
fi
echo ""

# Create user data script
cat > /tmp/build-userdata.sh <<'USERDATA'
#!/bin/bash
set -e

# Update system
yum update -y

# Install Docker
yum install -y docker git
systemctl start docker
systemctl enable docker

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Install git-lfs for large files
yum install -y amazon-linux-extras
amazon-linux-extras install -y git-lfs

# Create build directory
mkdir -p /build
cd /build

# The actual build commands will be added via user data

USERDATA

# Launch EC2 instance
echo -e "${BLUE}[3/8] Launching EC2 build instance...${NC}"
echo "Instance type: ${INSTANCE_TYPE}"
echo "This will take 2-3 minutes to start..."
echo ""

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ${AMI_ID} \
    --instance-type ${INSTANCE_TYPE} \
    --key-name ${KEY_NAME} \
    --security-group-ids ${SG_ID} \
    --subnet-id ${SUBNET_ID} \
    --associate-public-ip-address \
    --iam-instance-profile Name=farlabs-ec2-build-profile \
    --user-data file:///tmp/build-userdata.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=farlabs-build-instance}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo -e "${GREEN}✓ Instance launched: ${INSTANCE_ID}${NC}"
echo ""

# Wait for instance to be running
echo -e "${BLUE}[4/8] Waiting for instance to start...${NC}"
aws ec2 wait instance-running --instance-ids ${INSTANCE_ID}
echo -e "${GREEN}✓ Instance is running${NC}"
echo ""

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids ${INSTANCE_ID} --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "Public IP: ${PUBLIC_IP}"
echo ""

# Wait for SSH to be available
echo -e "${BLUE}[5/8] Waiting for SSH to be ready...${NC}"
for i in {1..30}; do
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} "echo ready" &>/dev/null; then
        echo -e "${GREEN}✓ SSH is ready${NC}"
        break
    fi
    echo "Waiting for SSH... (${i}/30)"
    sleep 10
done
echo ""

# Upload source code
echo -e "${BLUE}[6/8] Uploading source code...${NC}"
cd "${PROJECT_ROOT}"
tar czf /tmp/farlabs-source.tar.gz \
    frontend/ \
    backend/ \
    --exclude=node_modules \
    --exclude=__pycache__ \
    --exclude=.next \
    --exclude=dist \
    --exclude=build

scp -i ~/.ssh/${KEY_NAME}.pem /tmp/farlabs-source.tar.gz ec2-user@${PUBLIC_IP}:/tmp/
ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} "cd /build && tar xzf /tmp/farlabs-source.tar.gz"
echo -e "${GREEN}✓ Source code uploaded${NC}"
echo ""

# Build and push images
echo -e "${BLUE}[7/8] Building and pushing Docker images...${NC}"
echo "This will take 15-25 minutes. You can monitor progress with:"
echo "  ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo ""

ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} <<'REMOTE'
set -e

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

cd /build

# Build and push frontend
echo "Building frontend..."
cd frontend
docker build -t farlabs-frontend-free:latest .
docker tag farlabs-frontend-free:latest ${ECR_REGISTRY}/farlabs-frontend-free:latest
docker push ${ECR_REGISTRY}/farlabs-frontend-free:latest
cd ..

# Build and push auth
echo "Building auth service..."
cd backend/services/auth
docker build -t farlabs-auth-free:latest .
docker tag farlabs-auth-free:latest ${ECR_REGISTRY}/farlabs-auth-free:latest
docker push ${ECR_REGISTRY}/farlabs-auth-free:latest
cd ../../..

# Build and push api-gateway
echo "Building API gateway..."
cd backend/api-gateway
docker build -t farlabs-api-gateway-free:latest .
docker tag farlabs-api-gateway-free:latest ${ECR_REGISTRY}/farlabs-api-gateway-free:latest
docker push ${ECR_REGISTRY}/farlabs-api-gateway-free:latest
cd ../..

# Build and push payments
echo "Building payments service..."
cd backend/services/payments
docker build -t farlabs-payments-free:latest .
docker tag farlabs-payments-free:latest ${ECR_REGISTRY}/farlabs-payments-free:latest
docker push ${ECR_REGISTRY}/farlabs-payments-free:latest
cd ../../..

# Build and push gpu
echo "Building GPU service..."
cd backend/services/gpu
docker build -t farlabs-gpu-free:latest .
docker tag farlabs-gpu-free:latest ${ECR_REGISTRY}/farlabs-gpu-free:latest
docker push ${ECR_REGISTRY}/farlabs-gpu-free:latest
cd ../../..

# Build and push inference
echo "Building inference service..."
cd backend/services/inference
docker build -t farlabs-inference-free:latest .
docker tag farlabs-inference-free:latest ${ECR_REGISTRY}/farlabs-inference-free:latest
docker push ${ECR_REGISTRY}/farlabs-inference-free:latest
cd ../../..

# Build and push inference worker
echo "Building inference worker..."
cd backend/services/inference_worker
docker build -t farlabs-inference-worker-free:latest .
docker tag farlabs-inference-worker-free:latest ${ECR_REGISTRY}/farlabs-inference-worker-free:latest
docker push ${ECR_REGISTRY}/farlabs-inference-worker-free:latest
cd ../../..

echo "All images built and pushed successfully!"
REMOTE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All images built and pushed successfully!${NC}"
else
    echo -e "${RED}✗ Build failed. SSH to instance to debug:${NC}"
    echo "  ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
    exit 1
fi
echo ""

# Initialize database
echo -e "${BLUE}[8/8] Initializing database...${NC}"
ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP} <<DBINIT
docker run --rm \
  -v /build/backend/database:/sql \
  -e PGPASSWORD="FarLabs2025SecurePass!" \
  postgres:15 \
  psql -h ${RDS_ENDPOINT} \
       -U farlabs_admin \
       -d farlabs \
       -f /sql/init.sql
DBINIT

echo -e "${GREEN}✓ Database initialized${NC}"
echo ""

# Cleanup - terminate instance
echo -e "${BLUE}Cleaning up...${NC}"
read -p "Terminate build instance? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    aws ec2 terminate-instances --instance-ids ${INSTANCE_ID}
    echo -e "${GREEN}✓ Instance ${INSTANCE_ID} terminating${NC}"
    echo ""
    echo "The instance will be fully terminated in a few minutes."
    echo "Security group ${SG_ID} and key pair ${KEY_NAME} have been left for future use."
    echo "You can delete them manually if needed."
else
    echo ""
    echo -e "${YELLOW}Instance ${INSTANCE_ID} left running at ${PUBLIC_IP}${NC}"
    echo "Don't forget to terminate it when done:"
    echo "  aws ec2 terminate-instances --instance-ids ${INSTANCE_ID}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Your Far Labs platform is now fully deployed!"
echo ""
echo "Frontend URL: http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"
echo ""
echo "ECS services will automatically pull the images and start within 2-3 minutes."
echo ""
echo "Cost: ~$27/month (plus ~$0.10 for this one-time build if using t3.medium)"
echo ""

#!/bin/bash

# Far Labs - Frontend-Only Deployment
# Builds and deploys just the frontend with new download page

set -e

echo "================================================"
echo "Far Labs - Frontend Deployment"
echo "================================================"
echo ""

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
KEY_NAME="farlabs-deploy-key"
INSTANCE_TYPE="t3.small"  # Upgraded for faster Next.js builds
AMI_ID="ami-0453ec754f44f9a4a"  # Amazon Linux 2023

# Get VPC and Subnet
cd "$(dirname "$0")/../infra/terraform"
SUBNET_ID=$(terraform output -json | jq -r '.public_subnet_ids.value[0]')
VPC_ID=$(aws ec2 describe-subnets --subnet-ids ${SUBNET_ID} --query 'Subnets[0].VpcId' --output text)
cd -

echo "Creating security group..."
SG_ID=$(aws ec2 create-security-group \
    --group-name farlabs-frontend-build-sg-$(date +%s) \
    --description "Temporary SG for frontend build" \
    --vpc-id ${VPC_ID} \
    --query 'GroupId' \
    --output text)

# Allow SSH
aws ec2 authorize-security-group-ingress \
    --group-id ${SG_ID} \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 2>/dev/null || true

echo "Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ${AMI_ID} \
    --instance-type ${INSTANCE_TYPE} \
    --key-name ${KEY_NAME} \
    --security-group-ids ${SG_ID} \
    --subnet-id ${SUBNET_ID} \
    --iam-instance-profile Name=farlabs-ec2-build-profile \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=farlabs-frontend-builder}]" \
    --user-data '#!/bin/bash
yum update -y
yum install -y docker git
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user
' \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "Waiting for instance ${INSTANCE_ID} to be running..."
aws ec2 wait instance-running --instance-ids ${INSTANCE_ID}

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids ${INSTANCE_ID} \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "Instance running at ${PUBLIC_IP}"
echo "Waiting for SSH to be ready..."
sleep 30

# Test SSH connectivity
for i in {1..30}; do
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i ~/.ssh/farlabs-deploy-key.pem ec2-user@${PUBLIC_IP} 'echo ready' 2>/dev/null; then
        echo "SSH connection successful!"
        break
    fi
    echo "Waiting for SSH... ($i/30)"
    sleep 10
done

echo "Uploading frontend code..."
ssh -o StrictHostKeyChecking=no -i ~/.ssh/farlabs-deploy-key.pem ec2-user@${PUBLIC_IP} 'mkdir -p /home/ec2-user/build'
cd "$(dirname "$0")/.."
tar czf - frontend/ | ssh -o StrictHostKeyChecking=no -i ~/.ssh/farlabs-deploy-key.pem ec2-user@${PUBLIC_IP} 'cd /home/ec2-user/build && tar xzf -'

echo "Building and pushing frontend..."
ssh -o StrictHostKeyChecking=no -i ~/.ssh/farlabs-deploy-key.pem ec2-user@${PUBLIC_IP} 'bash -s' <<'REMOTE'
set -e

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

cd /home/ec2-user/build/frontend

echo "Building frontend..."
docker build -t farlabs-frontend-free:latest .
docker tag farlabs-frontend-free:latest ${ECR_REGISTRY}/farlabs-frontend-free:latest

echo "Pushing to ECR..."
docker push ${ECR_REGISTRY}/farlabs-frontend-free:latest

echo "✓ Frontend built and pushed!"
REMOTE

echo "Updating ECS service..."
aws ecs update-service \
    --cluster farlabs-cluster-free \
    --service farlabs-frontend-free \
    --force-new-deployment \
    --region ${AWS_REGION} >/dev/null

echo "Cleaning up..."
aws ec2 terminate-instances --instance-ids ${INSTANCE_ID} >/dev/null
aws ec2 delete-security-group --group-id ${SG_ID} 2>/dev/null || echo "Will clean up SG later..."

echo ""
echo "================================================"
echo "✓ Frontend Deployment Complete!"
echo "================================================"
echo ""
echo "The new frontend with /gpu/download page is deploying..."
echo "Wait 1-2 minutes for ECS to complete the deployment."
echo ""
echo "Verify at: http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/gpu/download"

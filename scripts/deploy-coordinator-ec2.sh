#!/bin/bash

# Far Labs - Far Mesh Coordinator Deployment (EC2-based build)
# Builds and deploys the Far Mesh Coordinator with new features

set -e

echo "================================================"
echo "Far Labs - Far Mesh Coordinator Deployment"
echo "================================================"
echo ""

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
KEY_NAME="farlabs-deploy-key"
INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0453ec754f44f9a4a"  # Amazon Linux 2023
EBS_VOLUME_SIZE="30"  # GB - needed for heavy ML dependencies

# Get VPC and Subnet
cd "$(dirname "$0")/../infra/terraform"
SUBNET_ID=$(terraform output -json | jq -r '.public_subnet_ids.value[0]')
VPC_ID=$(aws ec2 describe-subnets --subnet-ids ${SUBNET_ID} --query 'Subnets[0].VpcId' --output text)
cd -

echo "Creating security group..."
SG_ID=$(aws ec2 create-security-group \
    --group-name farlabs-coordinator-build-sg-$(date +%s) \
    --description "Temporary SG for coordinator build" \
    --vpc-id ${VPC_ID} \
    --query 'GroupId' \
    --output text)

# Allow SSH
aws ec2 authorize-security-group-ingress \
    --group-id ${SG_ID} \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 2>/dev/null || true

echo "Launching EC2 instance with ${EBS_VOLUME_SIZE}GB storage..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ${AMI_ID} \
    --instance-type ${INSTANCE_TYPE} \
    --key-name ${KEY_NAME} \
    --security-group-ids ${SG_ID} \
    --subnet-id ${SUBNET_ID} \
    --iam-instance-profile Name=farlabs-ec2-build-profile \
    --block-device-mappings "[{\"DeviceName\":\"/dev/xvda\",\"Ebs\":{\"VolumeSize\":${EBS_VOLUME_SIZE},\"VolumeType\":\"gp3\"}}]" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=farlabs-coordinator-builder}]" \
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

echo "Uploading Far Mesh Coordinator code..."
ssh -o StrictHostKeyChecking=no -i ~/.ssh/farlabs-deploy-key.pem ec2-user@${PUBLIC_IP} 'mkdir -p /home/ec2-user/build'
cd "$(dirname "$0")/.."
tar czf - backend/services/far_mesh_coordinator/ backend/common/ | ssh -o StrictHostKeyChecking=no -i ~/.ssh/farlabs-deploy-key.pem ec2-user@${PUBLIC_IP} 'cd /home/ec2-user/build && tar xzf -'

echo "Building and pushing Far Mesh Coordinator..."
ssh -o StrictHostKeyChecking=no -i ~/.ssh/farlabs-deploy-key.pem ec2-user@${PUBLIC_IP} 'bash -s' <<'REMOTE'
set -e

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="894059646844"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SERVICE_NAME="farlabs-far-mesh-coordinator-free"

echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Note: ECR repository should already exist (created during infrastructure setup)
echo "Using ECR repository: ${SERVICE_NAME}"

cd /home/ec2-user/build/backend/services/far_mesh_coordinator

echo "Building Far Mesh Coordinator (no cache)..."
docker build --no-cache -t ${SERVICE_NAME}:latest .
docker tag ${SERVICE_NAME}:latest ${ECR_REGISTRY}/${SERVICE_NAME}:latest

echo "Pushing to ECR..."
docker push ${ECR_REGISTRY}/${SERVICE_NAME}:latest

echo "✓ Far Mesh Coordinator built and pushed!"
REMOTE

echo "Updating ECS service..."
aws ecs update-service \
    --cluster farlabs-cluster-free \
    --service farlabs-far-mesh-coordinator-free \
    --force-new-deployment \
    --region ${AWS_REGION} >/dev/null

echo "Cleaning up..."
aws ec2 terminate-instances --instance-ids ${INSTANCE_ID} >/dev/null
aws ec2 delete-security-group --group-id ${SG_ID} 2>/dev/null || echo "Will clean up SG later..."

echo ""
echo "================================================"
echo "✓ Far Mesh Coordinator Deployment Complete!"
echo "================================================"
echo ""
echo "The updated Far Mesh Coordinator is deploying with:"
echo "  - Layer-specific payment tracking"
echo "  - Fine-tuning endpoints"
echo "  - Monitoring metrics endpoints"
echo ""
echo "Wait 1-2 minutes for ECS to complete the deployment."
echo ""

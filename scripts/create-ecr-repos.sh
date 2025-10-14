#!/bin/bash
set -e

# Far Labs - ECR Repository Creation Script
# Note: This is handled by Terraform in ecs.tf, but this script can be used standalone if needed

AWS_REGION="${AWS_REGION:-us-east-1}"

REPOS=(
    "farlabs-frontend"
    "farlabs-api-gateway"
    "farlabs-auth"
    "farlabs-payments"
    "farlabs-staking"
    "farlabs-inference"
    "farlabs-inference-worker"
    "farlabs-gpu"
    "farlabs-websocket"
    "farlabs-gaming"
    "farlabs-desci"
    "farlabs-gamed"
)

echo "Creating ECR repositories in $AWS_REGION..."

for REPO in "${REPOS[@]}"; do
    echo "Creating repository: $REPO"
    aws ecr create-repository \
        --repository-name "$REPO" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true \
        --tags Key=Project,Value=FarLabs \
        2>/dev/null || echo "Repository $REPO already exists"
done

echo "✓ ECR repositories created successfully!"
echo ""
echo "To push images, authenticate with:"
echo "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin \$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com"

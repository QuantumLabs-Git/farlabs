#!/bin/bash

# Far Labs - Complete Deployment Script
# This script completes the deployment by:
# 1. Initializing the database
# 2. Building and pushing Docker images
# 3. ECS services will automatically pull and start

set -e

echo "================================================"
echo "Far Labs - Complete Deployment"
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
RDS_ENDPOINT="farlabs-postgres-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com"
DB_NAME="farlabs"
DB_USER="farlabs_admin"
DB_PASSWORD="FarLabs2025SecurePass!"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}Project root: ${PROJECT_ROOT}${NC}"
echo ""

# Step 1: Check Docker is running
echo -e "${BLUE}[1/4] Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    echo -e "${YELLOW}Please start Docker Desktop manually:${NC}"
    echo "  - Open Docker Desktop from Applications"
    echo "  - Wait for Docker to fully start (icon in menu bar)"
    echo "  - Then run this script again"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Step 2: Initialize Database
echo -e "${BLUE}[2/4] Initializing PostgreSQL database...${NC}"
echo "Connecting to: ${RDS_ENDPOINT}"
echo "This will create tables: users, payment_balances, payment_transactions, staking_positions, staking_history, gpu_nodes, inference_tasks"
echo ""

docker run --rm \
  -v "${PROJECT_ROOT}/backend/database:/sql" \
  -e PGPASSWORD="${DB_PASSWORD}" \
  postgres:15 \
  psql -h "${RDS_ENDPOINT}" \
       -U "${DB_USER}" \
       -d "${DB_NAME}" \
       -f /sql/init.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database initialized successfully${NC}"
else
    echo -e "${RED}✗ Database initialization failed${NC}"
    echo "This might be OK if the database was already initialized."
fi
echo ""

# Step 3: Login to ECR
echo -e "${BLUE}[3/4] Logging into ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${ECR_REGISTRY}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Logged into ECR successfully${NC}"
else
    echo -e "${RED}✗ ECR login failed${NC}"
    exit 1
fi
echo ""

# Step 4: Build and Push Docker Images
echo -e "${BLUE}[4/4] Building and pushing Docker images...${NC}"
echo "This will take 10-20 minutes depending on your machine and internet speed."
echo ""

# Define services and their build contexts (matching actual project structure)
declare -A services=(
    ["farlabs-frontend-free"]="frontend"
    ["farlabs-auth-free"]="backend/services/auth"
    ["farlabs-api-gateway-free"]="backend/api-gateway"
    ["farlabs-payments-free"]="backend/services/payments"
    ["farlabs-gpu-free"]="backend/services/gpu"
    ["farlabs-inference-free"]="backend/services/inference"
    ["farlabs-inference-worker-free"]="backend/services/inference_worker"
)

total=${#services[@]}
current=0
failed_services=()

for service in "${!services[@]}"; do
    current=$((current + 1))
    build_context="${services[$service]}"

    echo -e "${BLUE}[${current}/${total}] Building ${service}...${NC}"
    echo "Build context: ${build_context}"

    # Check if Dockerfile exists
    if [ ! -f "${PROJECT_ROOT}/${build_context}/Dockerfile" ]; then
        echo -e "${RED}Warning: Dockerfile not found at ${build_context}/Dockerfile${NC}"
        failed_services+=("${service}")
        echo ""
        continue
    fi

    # Build image
    if docker build \
        -t ${service}:latest \
        -f "${PROJECT_ROOT}/${build_context}/Dockerfile" \
        "${PROJECT_ROOT}/${build_context}/"; then

        # Tag for ECR
        docker tag ${service}:latest ${ECR_REGISTRY}/${service}:latest

        # Push to ECR
        echo "Pushing ${service} to ECR..."
        if docker push ${ECR_REGISTRY}/${service}:latest; then
            echo -e "${GREEN}✓ ${service} built and pushed successfully${NC}"
        else
            echo -e "${RED}✗ Failed to push ${service}${NC}"
            failed_services+=("${service}")
        fi
    else
        echo -e "${RED}✗ Build failed for ${service}${NC}"
        failed_services+=("${service}")
    fi
    echo ""
done

# Summary
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Deployment Status${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

if [ ${#failed_services[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All services deployed successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Some services failed to deploy:${NC}"
    for service in "${failed_services[@]}"; do
        echo "  - ${service}"
    done
    echo ""
    echo "You can retry building failed services individually."
fi

echo ""
echo "Your Far Labs platform is now deployed on AWS!"
echo ""
echo -e "${BLUE}Frontend URL:${NC} http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for ECS services to pull images and start"
echo "2. Check service status:"
echo "   aws ecs describe-services --cluster farlabs-cluster-free --services farlabs-frontend-free"
echo ""
echo "3. View logs:"
echo "   aws logs tail /ecs/farlabs-frontend-free --follow"
echo ""
echo "4. Test the frontend:"
echo "   curl http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"
echo ""
echo -e "${BLUE}Estimated monthly cost: ~\$27${NC}"
echo ""

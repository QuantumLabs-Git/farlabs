#!/bin/bash
set -e

# Far Labs - Free Tier Deployment Script
# This script deploys the platform using free-tier and minimal cost resources

echo "================================================"
echo "Far Labs - Free Tier AWS Deployment"
echo "================================================"
echo ""
echo "This deployment will use:"
echo "  - ECS Fargate (Free Tier: 750 hours/month for first 12 months)"
echo "  - Application Load Balancer (Free Tier: 750 hours/month)"
echo "  - ElastiCache Redis t3.micro (~\$12/month - smallest option)"
echo "  - ECR (Free Tier: 500MB storage)"
echo "  - CloudWatch Logs (Free Tier: 5GB ingestion/month)"
echo "  - S3 (Free Tier: 5GB storage)"
echo ""
echo "Estimated monthly cost: \$12-20"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo ""

read -p "Continue with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Navigate to terraform directory
cd "$(dirname "$0")/../infra/terraform"

# Check if we should use the free-tier configuration
if [ ! -f "main-free-tier.tf" ]; then
    echo "Error: Free tier configuration not found!"
    exit 1
fi

# Rename files to use free-tier config
echo ""
echo "Step 1: Preparing free-tier configuration..."
if [ -f "main.tf" ]; then
    mv main.tf main-full.tf.bak
fi
if [ -f "ecs.tf" ]; then
    mv ecs.tf ecs-full.tf.bak
fi

cp main-free-tier.tf main.tf
cp ecs-free-tier.tf ecs.tf

echo "✓ Free-tier configuration activated"

# Create variables file
echo ""
echo "Step 2: Creating terraform.tfvars..."
cat > terraform.tfvars << EOF
region = "$AWS_REGION"
EOF

echo "✓ Variables file created"

# Initialize Terraform
echo ""
echo "Step 3: Initializing Terraform..."
terraform init

# Validate configuration
echo ""
echo "Step 4: Validating Terraform configuration..."
terraform validate

# Format Terraform files
echo ""
echo "Step 5: Formatting Terraform files..."
terraform fmt

# Create plan
echo ""
echo "Step 6: Creating deployment plan..."
terraform plan -out=tfplan-free

echo ""
echo "================================================"
echo "Terraform Plan Summary"
echo "================================================"
echo ""
echo "Review the plan above. This will create:"
echo "  - 1 VPC with 2 public subnets"
echo "  - 1 Application Load Balancer"
echo "  - 1 ECS Cluster"
echo "  - 7 ECS Services (1 instance each)"
echo "  - 1 ElastiCache Redis (t3.micro)"
echo "  - 7 ECR Repositories"
echo "  - CloudWatch Log Groups"
echo "  - S3 Buckets"
echo ""
echo "Estimated cost: \$12-20/month"
echo ""

read -p "Apply this plan? (yes/no): " APPLY_CONFIRM
if [ "$APPLY_CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    rm tfplan-free
    exit 0
fi

# Apply plan
echo ""
echo "Step 7: Applying Terraform plan..."
terraform apply tfplan-free

echo ""
echo "================================================"
echo "Infrastructure Deployment Complete!"
echo "================================================"
echo ""

# Get outputs
ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "N/A")
REDIS_ENDPOINT=$(terraform output -raw redis_endpoint 2>/dev/null || echo "N/A")

echo "Outputs:"
echo "  ALB DNS: $ALB_DNS"
echo "  Redis Endpoint: $REDIS_ENDPOINT"
echo ""

# Save outputs
terraform output > ../../terraform-outputs-free.txt
echo "✓ Outputs saved to terraform-outputs-free.txt"

echo ""
echo "================================================"
echo "Database Setup"
echo "================================================"
echo ""
echo "Waiting for RDS instance to be ready (~5-10 minutes)..."
echo "This is a good time to grab a coffee ☕"
echo ""

# Wait for RDS to be available
RDS_IDENTIFIER="farlabs-postgres-free"
echo "Checking RDS status..."

for i in {1..60}; do
    STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier "$RDS_IDENTIFIER" \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text 2>/dev/null || echo "pending")

    if [ "$STATUS" = "available" ]; then
        echo "✓ RDS instance is available!"
        break
    fi

    echo "  Status: $STATUS (attempt $i/60)"
    sleep 10
done

if [ "$STATUS" != "available" ]; then
    echo "⚠️  RDS is still not available. It may take a few more minutes."
    echo "You can check status with:"
    echo "  aws rds describe-db-instances --db-instance-identifier $RDS_IDENTIFIER"
else
    echo ""
    echo "Initializing database schema..."
    cd ../..
    chmod +x scripts/init-database.sh
    ./scripts/init-database.sh || echo "⚠️  Database init will be retried later"
    cd infra/terraform
fi

echo ""
echo "Next steps:"
echo "  1. Build and push Docker images:"
echo "     cd ../.."
echo "     ./scripts/build-and-push-free.sh"
echo ""
echo "  2. Access your application:"
echo "     Frontend: http://$ALB_DNS"
echo "     API: http://$ALB_DNS/healthz"
echo ""
echo "  3. Database connection:"
echo "     Host: $REDIS_ENDPOINT"
echo "     Database: farlabs"
echo "     User: farlabs_admin"
echo ""
echo "  4. Monitor costs (~\$27/month):"
echo "     https://console.aws.amazon.com/cost-management/home"
echo ""
echo "  5. To tear down everything:"
echo "     cd infra/terraform"
echo "     terraform destroy"
echo ""

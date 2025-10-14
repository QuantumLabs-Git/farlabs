#!/bin/bash
set -e

# Far Labs - Terraform Deployment Script

cd "$(dirname "$0")/../infra/terraform"

echo "Initializing Terraform..."
terraform init

echo "Formatting Terraform files..."
terraform fmt

echo "Validating Terraform configuration..."
terraform validate

echo "Planning Terraform deployment..."
terraform plan -out=tfplan

read -p "Do you want to apply this plan? (yes/no): " CONFIRM
if [ "$CONFIRM" = "yes" ]; then
    echo "Applying Terraform changes..."
    terraform apply tfplan

    echo ""
    echo "✓ Terraform deployment complete!"
    echo ""
    echo "Outputs:"
    terraform output
else
    echo "Deployment cancelled."
    rm tfplan
    exit 1
fi

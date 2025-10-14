#!/bin/bash
set -e

# Far Labs - AWS Secrets Manager Setup Script
# This script creates and populates AWS Secrets Manager secrets and SSM parameters

AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-prod}"

echo "Setting up Far Labs secrets in AWS Secrets Manager..."
echo "Region: $AWS_REGION"
echo "Environment: $ENVIRONMENT"

# Generate a secure JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT_SECRET: $JWT_SECRET"
fi

# Create main application secrets
echo "Creating application secrets..."
aws secretsmanager create-secret \
    --name "farlabs/$ENVIRONMENT/app" \
    --description "Far Labs application secrets" \
    --secret-string "{
        \"JWT_SECRET\": \"$JWT_SECRET\",
        \"DB_PASSWORD\": \"${DB_PASSWORD:-change-me}\",
        \"INFERENCE_PAYMENT_CONTRACT\": \"${INFERENCE_PAYMENT_CONTRACT:-0x00000000000000000000000000000000fA001234}\",
        \"TREASURY_WALLET\": \"${TREASURY_WALLET:-treasury}\",
        \"STAKER_POOL_WALLET\": \"${STAKER_POOL_WALLET:-staker_pool}\"
    }" \
    --region "$AWS_REGION" \
    --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value=FarLabs \
    2>/dev/null || echo "Secret already exists, updating..."

# Update the secret if it already exists
aws secretsmanager update-secret \
    --secret-id "farlabs/$ENVIRONMENT/app" \
    --secret-string "{
        \"JWT_SECRET\": \"$JWT_SECRET\",
        \"DB_PASSWORD\": \"${DB_PASSWORD:-change-me}\",
        \"INFERENCE_PAYMENT_CONTRACT\": \"${INFERENCE_PAYMENT_CONTRACT:-0x00000000000000000000000000000000fA001234}\",
        \"TREASURY_WALLET\": \"${TREASURY_WALLET:-treasury}\",
        \"STAKER_POOL_WALLET\": \"${STAKER_POOL_WALLET:-staker_pool}\"
    }" \
    --region "$AWS_REGION" \
    2>/dev/null || true

# Create SSM parameters for non-sensitive configuration
echo "Creating SSM parameters..."

aws ssm put-parameter \
    --name "/farlabs/$ENVIRONMENT/redis_url" \
    --value "${REDIS_URL:-redis://localhost:6379}" \
    --type "String" \
    --overwrite \
    --region "$AWS_REGION" \
    --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value=FarLabs

aws ssm put-parameter \
    --name "/farlabs/$ENVIRONMENT/bsc_rpc_url" \
    --value "${BSC_RPC_URL:-https://bsc-dataseed.binance.org/}" \
    --type "String" \
    --overwrite \
    --region "$AWS_REGION" \
    --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value=FarLabs

aws ssm put-parameter \
    --name "/farlabs/$ENVIRONMENT/jwt_expires_minutes" \
    --value "${JWT_EXPIRES_MINUTES:-120}" \
    --type "String" \
    --overwrite \
    --region "$AWS_REGION" \
    --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value=FarLabs

aws ssm put-parameter \
    --name "/farlabs/$ENVIRONMENT/skip_payment_validation" \
    --value "${SKIP_PAYMENT_VALIDATION:-false}" \
    --type "String" \
    --overwrite \
    --region "$AWS_REGION" \
    --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value=FarLabs

echo "✓ Secrets and parameters created successfully!"
echo ""
echo "To retrieve the JWT secret:"
echo "aws secretsmanager get-secret-value --secret-id farlabs/$ENVIRONMENT/app --region $AWS_REGION --query SecretString --output text | jq -r .JWT_SECRET"

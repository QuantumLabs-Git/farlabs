#!/bin/bash
set -e

# Far Labs - Local Development Deployment Script

echo "Starting Far Labs platform locally with Docker Compose..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_MINUTES=120
REDIS_URL=redis://redis:6379
BSC_RPC_URL=https://bsc-dataseed.binance.org/
SKIP_PAYMENT_VALIDATION=true
TREASURY_WALLET=treasury
STAKER_POOL_WALLET=staker_pool
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8080
EOF
fi

# Build and start all services
echo "Building and starting services..."
docker-compose up --build -d

echo ""
echo "✓ Far Labs platform is starting..."
echo ""
echo "Services:"
echo "  Frontend:           http://localhost:3000"
echo "  API Gateway:        http://localhost:8000"
echo "  Auth Service:       http://localhost:8001"
echo "  Payments Service:   http://localhost:8002"
echo "  Staking Service:    http://localhost:8003"
echo "  GPU Service:        http://localhost:8004"
echo "  Inference Service:  http://localhost:8005"
echo "  Gaming Service:     http://localhost:8006"
echo "  DeSci Service:      http://localhost:8007"
echo "  GameD Service:      http://localhost:8008"
echo "  Redis:              localhost:6379"
echo ""
echo "To view logs: docker-compose logs -f [service-name]"
echo "To stop all services: docker-compose down"

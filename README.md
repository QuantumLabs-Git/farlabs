# Far Labs Platform

This repository hosts the end-to-end reference implementation for the Far Labs ecosystem. It couples a high-fidelity Next.js frontend with FastAPI microservices, Solidity smart contracts, and Terraform infrastructure as code targeting AWS.

## Repository Layout

- **`frontend/`** – Next.js 14 + Tailwind CSS dApp with wallet integration, GPU onboarding, inference playground, payments/staking dashboard
- **`backend/`**
  - `api-gateway/` – FastAPI gateway with JWT authentication and service routing
  - `services/auth` – JWT token issuance and validation
  - `services/payments` – Redis-backed ledger for balances, escrow, and transaction history
  - `services/staking` – Staking positions, rewards, and history management
  - `services/inference` – AI inference task orchestration and payment processing
  - `services/inference_worker` – Background worker for executing inference tasks
  - `services/gpu` – GPU node registration, heartbeat tracking, and statistics
  - `services/websocket` – Real-time communication for inference results
  - `services/gaming`, `services/desci`, `services/gamed` – Additional revenue stream services
- **`contracts/`** – BSC smart contracts (FARToken, InferencePayment) with Hardhat tooling
- **`infra/terraform/`** – Complete AWS infrastructure (VPC, ECS Fargate, RDS, ElastiCache, ALB, CloudFront)
- **`scripts/`** – Deployment automation scripts
- **`docs/`** – Comprehensive documentation

## Quick Start

### Local Development (Recommended)

Run the entire platform locally with Docker Compose:

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start all services
./scripts/local-deploy.sh
```

This starts:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **All backend services** on ports 8001-8008
- **Redis**: localhost:6379

### Individual Service Development

#### Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

#### Backend Services
```bash
# Auth Service
cd backend/services/auth
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Payments Service
cd backend/services/payments
pip install -r requirements.txt
uvicorn main:app --reload --port 8002

# Staking Service
cd backend/services/staking
pip install -r requirements.txt
uvicorn main:app --reload --port 8003

# GPU Service
cd backend/services/gpu
pip install -r requirements.txt
uvicorn main:app --reload --port 8004

# Inference Service
cd backend/services/inference
pip install -r requirements.txt
uvicorn main:app --reload --port 8005

# Inference Worker
cd backend/services/inference_worker
pip install -r requirements.txt
python main.py

# API Gateway
cd backend/api-gateway
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## AWS Production Deployment

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Terraform >= 1.7.0
- Docker Desktop

### Deployment Steps

1. **Create Terraform Backend**
   ```bash
   aws s3 mb s3://farlabs-terraform-state --region us-east-1
   aws dynamodb create-table \
       --table-name farlabs-terraform-lock \
       --attribute-definitions AttributeName=LockID,AttributeType=S \
       --key-schema AttributeName=LockID,KeyType=HASH \
       --billing-mode PAY_PER_REQUEST
   ```

2. **Configure Secrets**
   ```bash
   export JWT_SECRET=$(openssl rand -base64 32)
   export DB_PASSWORD=<secure-password>
   ./scripts/setup-secrets.sh
   ```

3. **Deploy Infrastructure**
   ```bash
   ./scripts/deploy-terraform.sh
   ```
   Or manually:
   ```bash
   cd infra/terraform
   terraform init
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

4. **Configure GitHub Secrets**

   Add to your GitHub repository (Settings > Secrets):
   - `AWS_ACCOUNT_ID`
   - `AWS_IAM_ROLE_ARN`
   - `AWS_REGION`

5. **Deploy Application**

   Push to main branch to trigger GitHub Actions:
   ```bash
   git add .
   git commit -m "Deploy Far Labs"
   git push origin main
   ```

6. **Verify Deployment**
   ```bash
   # Get ALB DNS
   cd infra/terraform
   ALB_DNS=$(terraform output -raw alb_dns_name)

   # Test
   curl http://$ALB_DNS/healthz
   echo "Frontend: http://$ALB_DNS"
   ```

## Architecture Overview

### Frontend
- Next.js 14 with TypeScript
- Wagmi for Web3 wallet integration
- Real-time inference playground
- Payment and staking dashboards

### Backend Services
- **Auth**: HS256 JWT issuance via /api/auth/login
- **Payments**: Redis-backed ledger with escrow functionality
- **Staking**: Position tracking and rewards calculation
- **Inference**: GPU task orchestration with payment holds and settlements
- **GPU**: Node registration and heartbeat monitoring
- **Inference Worker**: Simulated inference execution (replace with actual GPU workload)

### Infrastructure
- **VPC**: Public/private subnets across 2 AZs
- **ECS Fargate**: 12 containerized services with auto-scaling
- **RDS PostgreSQL**: 15.5, Multi-AZ, encrypted storage
- **ElastiCache Redis**: 7.0 for caching and pub/sub
- **ALB**: Application routing with health checks
- **CloudFront**: CDN for static assets
- **Service Discovery**: Internal DNS for microservice communication

## API Endpoints

### Authentication
- `POST /api/auth/login` - Issue JWT token
- `GET /api/auth/me` - Get current user info

### Payments
- `GET /api/payments/balances/{wallet}` - Get wallet balances
- `POST /api/payments/topup` - Add funds
- `POST /api/payments/withdraw` - Withdraw funds
- `GET /api/payments/history/{wallet}` - Transaction history

### Staking
- `POST /api/staking/deposit` - Stake FAR tokens
- `POST /api/staking/withdraw` - Unstake tokens
- `GET /api/staking/position/{wallet}` - Get staking position
- `GET /api/staking/metrics` - Platform staking metrics

### Inference
- `POST /api/inference/generate` - Run inference task
- `GET /api/inference/tasks` - List user's tasks
- `GET /api/inference/tasks/{id}` - Get task details
- `WS /ws/inference/{task_id}` - Stream inference results

### GPU
- `POST /api/gpu/nodes` - Register GPU node
- `GET /api/gpu/nodes` - List all nodes
- `POST /api/gpu/nodes/{id}/heartbeat` - Update node status
- `GET /api/gpu/stats` - Network statistics

## Documentation

- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** – Complete deployment guide with troubleshooting
- **[System-Architecture.md](docs/System-Architecture.md)** – Service topology and communication flows
- **[Security-Architecture.md](docs/Security-Architecture.md)** – Security controls and best practices
- **[Backend-Services.md](docs/Backend-Services.md)** – API documentation
- **[Smart-Contracts.md](docs/Smart-Contracts.md)** – Contract specifications

## Environment Variables

### Required for Production
- `JWT_SECRET` - Secret key for JWT signing
- `DB_PASSWORD` - PostgreSQL password
- `REDIS_URL` - Redis connection string
- `BSC_RPC_URL` - Binance Smart Chain RPC endpoint
- `INFERENCE_PAYMENT_CONTRACT` - Payment contract address
- `TREASURY_WALLET` - Treasury wallet address
- `STAKER_POOL_WALLET` - Staking rewards pool address

### Optional
- `JWT_EXPIRES_MINUTES` - Token expiry (default: 120)
- `SKIP_PAYMENT_VALIDATION` - Disable payment checks for dev (default: false)

## Scripts

- `scripts/local-deploy.sh` - Start platform locally with Docker Compose
- `scripts/deploy-terraform.sh` - Deploy AWS infrastructure
- `scripts/setup-secrets.sh` - Configure AWS Secrets Manager
- `scripts/create-ecr-repos.sh` - Create ECR repositories

## Monitoring & Observability

- **CloudWatch Logs**: All services log to `/ecs/farlabs-{service}`
- **Container Insights**: Enabled on ECS cluster
- **Health Checks**: ALB health checks on all services
- **Metrics**: CPU, memory, request count, error rate

## Cost Estimation

Production deployment (us-east-1):
- **ECS Fargate**: ~$200-400/month
- **RDS r5.xlarge**: ~$300/month
- **ElastiCache r6g.xlarge**: ~$180/month
- **NAT Gateway**: ~$90/month
- **Data Transfer**: Variable
- **Total**: ~$800-1000/month

See [Cost-Estimates.md](docs/Cost-Estimates.md) for detailed breakdown.

## Security

- JWT-based authentication
- VPC isolation with public/private subnets
- Security groups for network access control
- Encrypted RDS storage
- IAM roles with least privilege
- Secrets stored in AWS Secrets Manager

**⚠️ Important**: Change all default secrets before production deployment.

## Testing

```bash
# Run local stack
./scripts/local-deploy.sh

# Test authentication
curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"wallet_address": "0x1234567890123456789012345678901234567890"}'

# Test inference (requires JWT token)
curl -X POST http://localhost:8000/api/inference/generate \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"model_id": "llama-70b", "prompt": "Hello world", "max_tokens": 100}'
```

## Troubleshooting

### Services not starting locally
```bash
# Check Docker
docker-compose ps
docker-compose logs -f <service-name>

# Rebuild specific service
docker-compose up --build <service-name>
```

### AWS deployment issues
```bash
# Check ECS tasks
aws ecs describe-services --cluster farlabs-cluster --services farlabs-frontend

# View logs
aws logs tail /ecs/farlabs-frontend --follow

# Force new deployment
aws ecs update-service --cluster farlabs-cluster --service farlabs-frontend --force-new-deployment
```

## Contributing

1. Create feature branch from `main`
2. Make changes
3. Test locally with docker-compose
4. Submit pull request
5. GitHub Actions will run CI checks

## License

See LICENSE file for details.

## Support

- Documentation: `docs/` directory
- Issues: GitHub Issues
- Deployment help: See [DEPLOYMENT.md](docs/DEPLOYMENT.md)

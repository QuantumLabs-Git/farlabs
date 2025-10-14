# Far Labs - Quick Start Guide

Get the Far Labs platform running in 5 minutes.

## Option 1: Docker Compose (Fastest - Recommended)

### Prerequisites
- Docker Desktop installed and running
- 8GB+ RAM available

### Steps

```bash
# Clone repository
git clone <repository-url>
cd far-labs-platform

# Make scripts executable
chmod +x scripts/*.sh

# Start everything
./scripts/local-deploy.sh
```

### Access Services

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000/healthz
- **Auth**: http://localhost:8001/healthz
- **Payments**: http://localhost:8002/healthz
- **Staking**: http://localhost:8003/health
- **GPU**: http://localhost:8004/health
- **Inference**: http://localhost:8005

### Test the Platform

1. **Get Authentication Token**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
   ```

   Copy the `token` from the response.

2. **Top Up Balance**
   ```bash
   TOKEN="<your-token-here>"

   curl -X POST http://localhost:8000/api/payments/topup \
       -H "Authorization: Bearer $TOKEN" \
       -H "Content-Type: application/json" \
       -d '{
           "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
           "amount": 100.0,
           "reference": "test-topup"
       }'
   ```

3. **Check Balance**
   ```bash
   curl http://localhost:8000/api/payments/balances/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
       -H "Authorization: Bearer $TOKEN"
   ```

4. **Register a GPU Node**
   ```bash
   curl -X POST http://localhost:8000/api/gpu/nodes \
       -H "Authorization: Bearer $TOKEN" \
       -H "Content-Type: application/json" \
       -d '{
           "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
           "gpu_model": "NVIDIA A100",
           "vram_gb": 80,
           "bandwidth_gbps": 10.0,
           "location": "us-east-1"
       }'
   ```

   Save the `node_id` from the response.

5. **Run Inference Task**
   ```bash
   curl -X POST http://localhost:8000/api/inference/generate \
       -H "Authorization: Bearer $TOKEN" \
       -H "Content-Type: application/json" \
       -d '{
           "model_id": "llama-70b",
           "prompt": "Explain quantum computing in simple terms",
           "max_tokens": 500,
           "temperature": 0.7
       }'
   ```

6. **Stake Tokens**
   ```bash
   curl -X POST http://localhost:8000/api/staking/deposit \
       -H "Authorization: Bearer $TOKEN" \
       -H "Content-Type: application/json" \
       -d '{
           "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
           "amount": 1000.0,
           "lock_period_days": 90
       }'
   ```

7. **View Staking Metrics**
   ```bash
   curl http://localhost:8000/api/staking/metrics \
       -H "Authorization: Bearer $TOKEN"
   ```

### View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f frontend
docker-compose logs -f inference
docker-compose logs -f inference-worker
```

### Stop Services

```bash
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Option 2: Manual Development Setup

For developing individual services.

### Prerequisites
- Python 3.11+
- Node.js 20+
- Redis (via Docker or local)

### 1. Start Redis

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 2. Start Backend Services

```bash
# Terminal 1 - Auth Service
cd backend/services/auth
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Terminal 2 - Payments Service
cd backend/services/payments
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8002

# Terminal 3 - Staking Service
cd backend/services/staking
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8003

# Terminal 4 - GPU Service
cd backend/services/gpu
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8004

# Terminal 5 - Inference Service
cd backend/services/inference
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8005

# Terminal 6 - Inference Worker
cd backend/services/inference_worker
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Terminal 7 - API Gateway
cd backend/api-gateway
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Start Frontend

```bash
# Terminal 8 - Frontend
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000

## Next Steps

1. **Connect Wallet** - Use the frontend to connect your Web3 wallet
2. **Explore Dashboard** - Navigate to the payments and staking dashboards
3. **Run Inference** - Try the inference playground
4. **Register GPU Node** - Add your GPU nodes to the network
5. **Monitor Activity** - View transaction history and node statistics

## Troubleshooting

### Docker Issues

```bash
# Check if Docker is running
docker ps

# Restart Docker Desktop if needed
# Then run: ./scripts/local-deploy.sh
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Services Not Connecting

```bash
# Check Redis is running
docker ps | grep redis

# Restart all services
docker-compose restart
```

### Frontend Build Errors

```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

## Production Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for AWS deployment instructions.

## Resources

- **Full Documentation**: [README.md](README.md)
- **Deployment Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Architecture**: [docs/System-Architecture.md](docs/System-Architecture.md)
- **API Reference**: [docs/Backend-Services.md](docs/Backend-Services.md)

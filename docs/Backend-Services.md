## Backend Services Overview

| Service | Language | Responsibility | Key Integrations |
|---------|----------|----------------|------------------|
| API Gateway | Python (FastAPI) | Single entry point, auth, routing | ECS services, Redis, Secrets Manager |
| Inference | Python (FastAPI) | GPU orchestration, payment verification | Redis queue, InferencePayment contract |
| WebSocket | Node.js (Socket.IO) | Realtime updates, subscriptions | Redis pub/sub, PostgreSQL (Prisma) |
| Gaming | Python (FastAPI) | Tournament APIs, loyalty rewards | PostgreSQL, Web3 events |
| DeSci | Python (FastAPI) | Grant workflows, data marketplace | PostgreSQL, IPFS gateway |
| GameD | Python (FastAPI) | Game distribution catalog | S3 (asset links), PostgreSQL |
| GPU | Python (FastAPI) | Node provisioning, telemetry | Redis, DynamoDB, Web3 |
| Staking | Python (FastAPI) | Metrics, reward schedules | PostgreSQL, FARToken contract |

### Shared Libraries (`backend/common`)
- Authentication helpers (JWT validation, wallet signature verification)
- Database session management (SQLAlchemy / Prisma)
- Event bus client (Redis)
- Observability middleware (logging, tracing)

### Configuration
- Each service loads configuration via environment variables:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `BSC_RPC_URL`
  - `JWT_SECRET`
  - `SERVICE_NAME`
- Use AWS Parameter Store or Secrets Manager to inject values into ECS task definitions.

### Deployment
- Package each service as Docker container.
- Deploy via ECS Fargate with separate task definitions and services.
- Use Application Load Balancer path-based routing (`/inference/*`, `/gaming/*`, etc.).
- WebSocket service listens on port 3001 behind ALB listener rule (`wss`).

### Testing
- Unit tests (pytest, vitest) per service.
- Contract tests validate gateway proxies.
- Integration tests run against docker-compose stack replicating Redis + Postgres.

### Roadmap Enhancements
- Service mesh (AWS App Mesh) for mTLS and canary deploys.
- Event-driven architecture using Amazon EventBridge for on-chain event ingestion.
- gRPC interface for high-performance inference streaming.

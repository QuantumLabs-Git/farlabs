## System Architecture Overview

The Far Labs platform orchestrates six revenue-generating products under a unified $FAR token economy. This document reinforces the architecture diagrams shared in the technical specification and describes service responsibilities, communication flows, and data storage decisions.

---

### High-Level Topology

```
CloudFront CDN
    │
Application Load Balancer
    ├── Next.js Frontend (ECS Fargate)
    ├── API Gateway (FastAPI)
    ├── WebSocket Service (Node.js + Socket.IO)
    └── Admin Dashboard (Next.js app dir route)
        │
        └── ECS Microservices Layer
            ├── Inference Service (FastAPI, Redis queue)
            ├── Gaming Service (FastAPI)
            ├── DeSci Service (FastAPI)
            ├── GameD Service (FastAPI)
            ├── GPU Service (FastAPI)
            └── Staking Service (FastAPI)

Data Layer
    ├── PostgreSQL (RDS) – core relational data
    ├── MongoDB Atlas – analytics, logs, usage traces
    ├── DynamoDB – FarTwin agent state, real-time attribution
    └── ElastiCache (Redis) – queues, pub/sub, caching

Blockchain
    ├── FARToken.sol
    └── InferencePayment.sol
```

---

### Communication Patterns

1. **User Request Flow**
   - Browser → CloudFront (static assets cached)
   - CloudFront → ALB → Next.js SSR routes
   - Frontend fetches data via API Gateway (`/api/*`) or subscribes to WebSockets for live updates
   - Gateway proxies to appropriate microservice (FastAPI) or reads from Redis cache
   - Microservice interacts with PostgreSQL / MongoDB / DynamoDB / BSC smart contracts
   - Response cascades back to the frontend

2. **WebSocket Flow**
   - Client connects to WebSocket service through ALB (port 443 → 3001)
   - Service authenticates via JWT + Prisma (PostgreSQL)
   - Subscribes to Redis channels to stream inference token updates, GPU metrics, revenue updates
   - Emits messages to client rooms (per-user, per-task, per-node)

3. **Payment Flow**
   - User signs transaction via wallet (WalletConnect / injected connectors)
   - `InferencePayment` contract escrows $FAR during task creation
   - Oracle (backend) finalizes tasks with on-chain distribution (GPU operator, stakers, treasury)
   - Events ingested by Web3 listener -> API Gateway updates DB -> WebSocket notifies stakeholders

---

### Component Responsibilities

- **Next.js Frontend**
  - Mission control dashboard, staking UI, revenue simulators
  - Wallet integrations via `wagmi` + BSC RPC
  - Tailwind-driven high-tech aesthetic (glassmorphism, neon glows, radial hover tracking)

- **Inference Service**
  - Validates JWT, verifies escrow balance, schedules inference tasks
  - Redis queue (`inference_queue`) for GPU worker consumption
  - Publishes task updates to Redis pub/sub for WebSocket streaming
  - Node scoring with performance-based reward adjustment

- **API Gateway**
  - Entry point for REST/GraphQL (extendable) requests
  - Handles auth, rate limiting (stubbed), service discovery
  - Aggregates data for UI (revenue summary, staking metrics)

- **WebSocket Service**
  - Horizontal scaling via Socket.IO Redis adapter
  - Live inference token streaming, node monitoring, revenue push notifications

- **Domain Microservices**
  - Gaming, DeSci, GameD, GPU, Staking each manage domain-specific logic and integrate with the shared data layer

---

### Data Stores

- **PostgreSQL (RDS)**
  - User profiles, GPU nodes, inference task history, staking records, revenue streams
  - Schema defined in `docs/sql/schema.sql`

- **MongoDB Atlas**
  - High-volume inference logs, performance metrics, user activity heatmaps
  - TTL indexes for ephemeral analytics snapshots

- **DynamoDB**
  - FarTwin AI persona state and knowledge graphs
  - Optimized for rapid reads and writes with on-demand capacity

- **ElastiCache Redis**
  - Task queue (list) and event channels (pub/sub)
  - Caching Web3 reads (token balances, staking metrics)

---

### Observability

- CloudWatch for ECS, RDS, and ALB metrics
- OpenTelemetry instrumentation (FastAPI + Node) → AWS X-Ray or DataDog
- Log routing from CloudWatch → S3/Firehose for retention and analytics
- Prometheus-compatible metrics stack for GPU telemetry

---

### Security Architecture Highlights

- VPC segmentation (public vs private subnets) with security groups restricting east-west traffic
- Secrets Manager for credentials; IAM roles for task execution
- TLS everywhere (CloudFront ↔ ALB ↔ ECS via ACM certs)
- WAF + Shield Advanced defending the public edge
- CloudTrail, GuardDuty, and Config for continuous monitoring

---

### Deployment Pipeline

- GitHub Actions builds and pushes Docker images to ECR
- Terraform applies infrastructure changes
- ECS services updated via rolling deployments (`minimumHealthyPercent` tuned per service)
- Database migrations executed during deployment via separate workflow job

---

### Cost Considerations

- Autoscaling policies tuned for CPU, memory, and custom metrics (GPU network utilization)
- Spot Fargate profiles for stateless workloads (gaming, WebSocket)
- Reserved Instances / Savings Plans for RDS and base ECS capacity
- S3 lifecycle policies to transition logs to Glacier

---

For further detail refer to the technical specification and deployment guide. This document serves as a living artifact—update alongside infrastructure or service changes to maintain architectural fidelity.

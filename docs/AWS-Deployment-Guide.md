## Far Labs AWS Deployment Guide

This guide walks through provisioning, configuring, and deploying the Far Labs platform to AWS using Terraform, ECS Fargate, and a GitHub Actions-based CI/CD pipeline.

---

### 1. Prerequisites

- AWS account with administrator privileges (organization member or delegated IAM role)
- Terraform `>= 1.7.0`
- AWS CLI `>= 2.13` authenticated with programmatic access
- Docker (for building and pushing images)
- GitHub (or GitLab) repository secrets for CI workflows
- Node.js `>= 18` and Python `>= 3.11` for local development

Create an S3 bucket (`farlabs-terraform-state`) and DynamoDB table (`farlabs-terraform-lock`) for Terraform state management before running `terraform init`.

---

### 2. Provision Infrastructure

1. **Clone Repo & Enter Terraform Directory**
   ```bash
   git clone git@github.com:far-labs/platform.git
   cd platform/infra/terraform
   ```

2. **Configure Variables**
   Create a `terraform.tfvars` file:
   ```hcl
   region      = "us-east-1"
   db_username = "farlabs_admin"
   db_password = "generate-a-strong-password"
   ```

3. **Initialize & Validate**
   ```bash
   terraform init \
     -backend-config="bucket=farlabs-terraform-state" \
     -backend-config="key=prod/terraform.tfstate" \
     -backend-config="region=us-east-1"

   terraform validate
   ```

4. **Plan & Apply**
   ```bash
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

Key resources provisioned:
- VPC with public (ALB) and private (ECS, RDS, ElastiCache) subnets
- ECS cluster for frontend and microservices (Fargate tasks)
- RDS PostgreSQL (encrypted, Multi-AZ)
- ElastiCache Redis for pub/sub workloads
- S3 buckets (static assets, AI model storage, user uploads)
- CloudFront CDN fronting the ALB

---

### 3. Container Registry & Images

1. **Create ECR Repositories**
   ```bash
   aws ecr create-repository --repository-name farlabs-frontend
   aws ecr create-repository --repository-name farlabs-api-gateway
   aws ecr create-repository --repository-name farlabs-desci
   aws ecr create-repository --repository-name farlabs-gamed
   aws ecr create-repository --repository-name farlabs-gaming
   aws ecr create-repository --repository-name farlabs-gpu
   aws ecr create-repository --repository-name farlabs-inference
   aws ecr create-repository --repository-name farlabs-staking
   aws ecr create-repository --repository-name farlabs-websocket
   ```

2. **Authenticate & Push Images**
   ```bash
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com

   docker build -t farlabs-frontend:latest ../frontend
   docker tag farlabs-frontend:latest <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/farlabs-frontend:latest
   docker push <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/farlabs-frontend:latest
   ```

3. **Repeat** for backend services (inference, websocket, api gateway).

---

### 4. Secrets & Configuration

Utilize AWS Secrets Manager for sensitive values:

- `farlabs/db` → `DATABASE_URL` for frontend and microservices
- `farlabs/jwt` → JWT signing secret for API Gateway & WebSocket server
- `farlabs/web3` → Blockchain RPC endpoints & private keys

Example command:
```bash
aws secretsmanager create-secret \
  --name farlabs/db \
  --secret-string '{"DATABASE_URL":"postgresql+psycopg://user:pass@endpoint:5432/farlabs"}'
```

Grant ECS task roles permission (`secretsmanager:GetSecretValue`) via IAM policies.

---

### 5. ECS Task Definitions & Services

Store task definitions as JSON and register via AWS CLI or Terraform ECS service modules. Example snippet for the frontend (also included in `docs/assets/task-definitions/frontend.json`):

```json
{
  "family": "farlabs-frontend",
  "taskRoleArn": "arn:aws:iam::<ACCOUNT>:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT>:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "nextjs-app",
      "image": "<ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/farlabs-frontend:latest",
      "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "NEXT_PUBLIC_API_URL", "value": "https://api.farlabs.ai" },
        { "name": "NEXT_PUBLIC_WS_URL", "value": "wss://ws.farlabs.ai" },
        { "name": "NEXT_PUBLIC_BSC_RPC", "value": "https://bsc-dataseed.binance.org/" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT>:secret:farlabs/db"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/farlabs-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register and create ECS services pointing to your ALB target groups. Enable auto-scaling via Application Auto Scaling using the policy template in `infra/terraform/ecs-autoscaling.yaml`.

---

### 6. CI/CD Pipeline

GitHub Actions workflow outline (`.github/workflows/deploy.yaml`):

1. Trigger on `main` branch pushes and release tags.
2. Jobs:
   - **Lint/Test**: run `npm run lint` (frontend), `pytest` (python services), `npm test` (node).
   - **Build**: docker build images and tag with commit SHA.
   - **Push**: authenticate to ECR and push images.
   - **Deploy**: update ECS services using `aws ecs update-service --force-new-deployment`.

Store secrets as encrypted GitHub repository secrets:
- `AWS_ACCOUNT_ID`
- `AWS_REGION`
- `AWS_IAM_ROLE_ARN`
- `BSC_RPC_URL`
- `INFRA_SSH_KEY` (if using bastion for migrations)

### 6.1 GitHub OIDC Configuration

To avoid long-lived AWS keys in GitHub:

1. **IAM Identity Provider**  
   - Create an OpenID Connect provider for `https://token.actions.githubusercontent.com` with audience `sts.amazonaws.com`.
   - Create an IAM role (for example `FarLabsGitHubDeployRole`) that trusts the provider and scopes access to the repository `QuantumLabs-Git/Far-Labs-Codebase` (add branch filters if required).

2. **Attach Permissions**  
   - Attach a least-privilege policy allowing ECR pushes, ECS task/ service updates, `iam:PassRole` for ECS task roles, and read access to CloudWatch logs.  
   - For Terraform workflows, create a second role or expand the policy to include VPC, IAM, RDS, and other resource permissions.

3. **Repository Secrets**  
   Add the following secrets under *Settings → Secrets and variables → Actions*:
   - `AWS_ACCOUNT_ID`
   - `AWS_REGION`
   - `AWS_IAM_ROLE_ARN`
   - Application config values required by the frontend and WebSocket layers:
     - `NEXT_PUBLIC_BSC_RPC`
     - `NEXT_PUBLIC_FAR_TOKEN`
     - `NEXT_PUBLIC_INFERENCE_PAYMENT`
     - `NEXT_PUBLIC_STAKING_CONTRACT`
     - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
     - `NEXT_PUBLIC_API_URL`
     - `NEXT_PUBLIC_WS_URL`
   - `NEXT_PUBLIC_DEMO_JWT` (optional fallback token for local testing)
   - plus runtime secrets such as `JWT_SECRET`, `DATABASE_URL`, and any third-party API keys.
  - Runtime toggles:
    - `SKIP_PAYMENT_VALIDATION` (set to `false` in production to enforce on-chain escrow checks).
     - `TREASURY_WALLET`, `STAKER_POOL_WALLET` (target wallets for revenue splits).
     - `JWT_EXPIRES_MINUTES` to control auth token lifetime.

4. **Workflow Configuration**  
   - Ensure workflows grant `id-token: write` permission and call `aws-actions/configure-aws-credentials@v4` with the role ARN.  
   - Update the deploy matrix to include every ECS service (frontend, API gateway, inference, WebSocket, and the domain microservices).

---

### 7. Database & Schema Management

- **PostgreSQL**: apply DDL scripts from `docs/sql/schema.sql` (mirrors section 7.1 of the technical spec). Run migrations via `alembic` or Prisma once ECS services are deployed.
- **MongoDB Atlas**: provision cluster for analytics. Configure VPC peering or PrivateLink to restrict traffic.
- **DynamoDB**: create tables for AI agent knowledge graphs (`FarTwin`) and WebSocket session caches.

---

### 8. Security Controls

- Enforce TLS 1.3 via CloudFront and ALB listener policies.
- Use AWS WAF for ALB to protect against common attack vectors.
- Enable AWS Shield Advanced for DDoS resistance (optional).
- Store all secrets in Secrets Manager; never bake secrets into container images.
- Use IAM roles per ECS task definition (least privilege).
- Enable GuardDuty, Config, and CloudTrail for monitoring and auditing.
- Configure Security Hub + Detective to centralize findings.

---

### 9. Monitoring & Observability

- **Logs**: CloudWatch log groups per ECS service, with subscription filters to Kinesis Firehose / S3 if needed.
- **Metrics**: CloudWatch dashboards tracking CPU, memory, request latency, Redis connections, RDS metrics.
- **Tracing**: Integrate AWS X-Ray SDK into FastAPI and Node services for distributed tracing.
- **Analytics**: Stream inference telemetry to Amazon OpenSearch or managed Prometheus for dashboarding (Grafana).

---

### 10. Cost Management

- Tag all AWS resources (`Environment`, `Service`, `Owner`) for cost allocation.
- Use AWS Budgets with alerts tied to monthly spend thresholds.
- Enable Compute Savings Plans for predictable ECS workload usage.
- Right-size RDS / ElastiCache with performance insights and reserved instances once usage stabilizes.

---

### 11. Disaster Recovery

- Multi-AZ RDS deployment with PITR (Point-in-time recovery).
- Nightly ECR image replication to secondary region.
- Cross-region S3 replication for user uploads and model artifacts.
- Scheduled Terraform `plan` runs to detect drift.

---

### 12. Post-Deployment Checklist

- [ ] Domain DNS records updated to CloudFront distribution.
- [ ] SSL certificates issued (ACM) and attached to CloudFront / ALB.
- [ ] Secrets Manager rotation configured (RDS credentials, JWT secrets).
- [ ] Health checks for ECS services returning `200`.
- [ ] Synthetic canaries (CloudWatch Synthetics) configured for user-critical journeys.
- [ ] Incident response playbooks documented and on-call rotation assigned.

Following this guide will deliver the production-ready Far Labs stack aligned with the technical specification, leveraging AWS managed services for resilience, scalability, and security.

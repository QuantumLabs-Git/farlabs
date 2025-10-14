## Cost Estimates (Monthly USD)

| Layer | Service | Resource | Est. Cost | Notes |
|-------|---------|----------|-----------|-------|
| Compute | ECS Fargate | Frontend (2 tasks, 0.25 vCPU/512 MB) | $120 | Assumes 50% utilization, on-demand |
| Compute | ECS Fargate | API & microservices (8 tasks, 0.5 vCPU/1 GB) | $920 | Consider Savings Plan for 30% discount |
| Compute | ECS Fargate | WebSocket service (4 tasks, spot) | $210 | Spot pricing with interruption handling |
| Data | RDS PostgreSQL | db.r5.xlarge (Multi-AZ) | $1,020 | Includes storage + IO credits |
| Data | ElastiCache Redis | cache.r6g.xlarge | $420 | Use replication group for HA |
| Data | DynamoDB | On-demand (50 RCU / 50 WCU) | $65 | Scales with FarTwin usage |
| Storage | S3 | Static assets + uploads (2 TB) | $46 | Does not include egress |
| CDN | CloudFront | 15 TB transfer | $1,275 | Price varies by geography |
| Networking | NAT Gateway | 2 gateways (720 hrs) | $147 | Reduce by using VPC endpoints |
| Security | AWS WAF | 10 ACLs + 100 rules | $180 | Enable logging for audit |
| Monitoring | CloudWatch | Logs + metrics + X-Ray | $250 | Optimize log retention policies |
| Analytics | MongoDB Atlas | M30 cluster | $380 | Dedicated analytics workload |

**Total (baseline)**: **~ $5,033 / month**

### Optimization Levers
1. Commit to Compute Savings Plans (1-yr) → up to 20% savings on ECS + RDS.
2. Adopt Graviton-based Fargate tasks (arm64 images) for 15% reduction.
3. Configure S3 lifecycles (upload → IA after 30 days → Glacier after 90 days).
4. Enable scheduled scaling (overnight downscaling) for API services.
5. Use RDS storage auto-scaling to avoid over-provisioning.

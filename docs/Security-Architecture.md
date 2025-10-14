## Security Architecture

### Infrastructure
- **Networking**: Dedicated VPC with public (ALB) and private (ECS, RDS, Redis) subnets. Security groups enforce least privilege east-west traffic. NACLs add stateless filters against common port scans.
- **Access**: All administrative access via AWS SSO + MFA. Bastion hosts replaced with AWS Systems Manager Session Manager.
- **Encryption**: 
  - At rest: KMS-managed keys for RDS, ElastiCache, DynamoDB, and S3 buckets.
  - In transit: TLS 1.3 enforced on CloudFront and ALB (ACM certificates). Internal service communication secured via mutual TLS (service mesh roadmap).
- **Secrets**: AWS Secrets Manager + Parameter Store. IAM task roles grant scoped `secretsmanager:GetSecretValue` permissions.

### Application
- **Authentication**: JWT access tokens (15 min) with refresh tokens in HttpOnly cookies. Wallet signatures (EIP-4361) for critical actions. WebSocket handshake enforces JWT.
- **Authorization**: Role-based access within API gateway. Smart contract ownership controlled via multi-sig (Safe).
- **Input Validation**: Pydantic schemas (FastAPI) and Zod (Next.js) to sanitize inputs. Rate limiting via API Gateway and Redis token bucket (planned).
- **Payments**: On-chain settlement via `InferencePayment.sol`. Performance-based adjustments capped at ±10%. Node registration requires oracle approval.

### Monitoring & Detection
- CloudTrail + GuardDuty + Security Hub aggregated to centralized account.
- AWS Config rules to detect drift (public S3 buckets, insecure security groups).
- AWS WAF with managed rulesets shields ALB; Shield Advanced for L3/L4 DDoS.
- CloudWatch alarms for unusual spikes (auth failures, 5xx errors, transaction anomalies).

### Compliance & Governance
- Logs retained for 400 days (CloudWatch → S3). 
- IAM Access Analyzer to guard against unintended resource exposure.
- Periodic penetration testing scheduled pre-release; bug bounty program planned.
- Data classification applied to S3 buckets (public, internal, restricted).

### Incident Response
- Runbooks stored in Confluence and mirrored in AWS Systems Manager Documents.
- PagerDuty escalation for P0/P1 incidents; Slack + email alerts for P2/P3.
- Immutable audit trails (CloudTrail, contract events) support forensic analysis.

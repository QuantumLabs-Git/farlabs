## Deployment Pipeline

### Build Stages
1. **Code Quality**
   - `frontend`: `npm run lint` + `npm run build`
   - `backend/services/*`: `ruff` / `pytest` for Python, `eslint` / `tsc` for Node services
   - `contracts`: `npx hardhat compile` ensures Solidity builds pass

2. **Containerization**
   - Docker build for each deployable (`frontend`, `api-gateway`, `inference`, `websocket`)
   - Tag images with `git rev-parse --short HEAD`
   - Push to ECR repository per service

3. **Infrastructure Drift**
   - `terraform plan` executed in preview mode; on approval, pipeline runs `terraform apply`

4. **Migrations**
   - Run database migrations (Alembic / Prisma) against staging then production.

### Deployment Strategy
- ECS rolling deploy (`minimumHealthyPercent=50`, `maximumPercent=200`) to ensure zero downtime.
- Feature flags for gated releases (frontend uses LaunchDarkly or open-source equivalent).
- Blue/green deployment for inference service to safeguard long-running jobs.

### Environments
1. **Development** – ephemeral preview environments per PR (Netlify / Vercel for frontend, AWS Copilot for backend).
2. **Staging** – mirrors production with scaled-down capacity; runs nightly integration tests.
3. **Production** – triggered only from tagged releases, requires manual approval.

### Rollback Procedure
1. ECS: `aws ecs update-service --force-new-deployment --task-definition <previous>` or rely on `deploymentCircuitBreaker`.
2. Terraform: run `terraform apply` with previous state file or use `terraform destroy` for erroneous stacks.
3. Smart Contracts: restricted to multi-sig; use upgradeable proxies or deploy new instance with registry update.

### Testing Automation
- **Contract Tests**: Hardhat + Foundry fuzzing (optional) for critical financial logic.
- **Integration Tests**: Postman / Newman suite hitting API Gateway endpoints post-deploy.
- **Synthetic Monitoring**: CloudWatch Synthetics canaries validating critical user journeys hourly.

### Observability Hooks
- GitHub Actions step posts deployment metadata to Slack and attaches CloudWatch dashboard URL.
- ECS task definitions embed `GIT_SHA` env var for observability correlation.

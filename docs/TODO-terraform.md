## Terraform Follow-up Checklist

1. **Network Fixes**
   - Add an Internet Gateway, public route table, and associations for the ALB subnets (`aws_internet_gateway`, `aws_route_table`, `aws_route_table_association`).
   - Re-run `terraform plan/apply` once the networking blocks are in place.

2. **RDS Engine Update**
   - Bump the PostgreSQL engine version from `15.4` to an available version (e.g., `15.5`) so `aws_db_instance.postgres` can be created.
   - Reapply to provision the database and capture the new endpoint for secrets.

3. **ECS Definitions**
   - Define task definitions and services for every container (frontend, api-gateway, inference, gpu, payments, auth, websocket, desci, gamed, gaming, staking).
   - Attach IAM execution/task roles with permissions for CloudWatch logs, Secrets Manager, and SSM.
   - Wire ALB target groups/listener rules and autoscaling policies.

4. **Secrets/Parameters Integration**
   - Map Secrets Manager (`farlabs/prod/app`) and Parameter Store (`/farlabs/prod/...`) values into the ECS task definitions via `secrets` and `environment`.
   - Ensure task roles include `secretsmanager:GetSecretValue`, `ssm:GetParameters`, and `kms:Decrypt` (if applicable).

5. **Outputs**
   - Expose ALB DNS, RDS endpoint, Redis endpoint (already defined) and any new ECS service ARNs you need for GitHub workflows.

Revisit this list once application development is complete so infrastructure stays in sync with the runtime requirements.

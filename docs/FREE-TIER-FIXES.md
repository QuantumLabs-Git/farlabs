# Free Tier - Quick Fixes

## Fix #1: Service Discovery (REQUIRED)

The free-tier setup uses public subnets, so service discovery via `.internal` DNS won't work. Here's the fix:

### Option A: Simple Fix - Use Environment Variables (Recommended)

Update the API Gateway to use environment variables instead of hardcoded service discovery:

1. **Edit `backend/api-gateway/main.py`:**

```python
# Change from:
SERVICE_ROUTES = {
    "inference": "http://inference-service.internal:8000",
    "gpu": "http://gpu-service.internal:8000",
    "payments": "http://payments-service.internal:8000",
    "auth": "http://auth-service.internal:8000",
}

# To:
SERVICE_ROUTES = {
    "inference": os.getenv("INFERENCE_URL", "http://localhost:8005"),
    "gpu": os.getenv("GPU_URL", "http://localhost:8004"),
    "payments": os.getenv("PAYMENTS_URL", "http://localhost:8002"),
    "auth": os.getenv("AUTH_URL", "http://localhost:8001"),
}
```

2. **Update ECS task definition in `ecs-free-tier.tf`:**

```hcl
resource "aws_ecs_task_definition" "api_gateway_free" {
  # ... existing config ...

  container_definitions = jsonencode([
    {
      name  = "api-gateway"
      image = "${aws_ecr_repository.api_gateway_free.repository_url}:latest"
      # ... existing config ...

      environment = [
        {
          name  = "JWT_SECRET"
          value = "dev-secret-change-in-production"
        },
        # Add these:
        {
          name  = "AUTH_URL"
          value = "http://auth-service.internal:8000"
        },
        {
          name  = "PAYMENTS_URL"
          value = "http://payments-service.internal:8000"
        },
        {
          name  = "INFERENCE_URL"
          value = "http://inference-service.internal:8000"
        },
        {
          name  = "GPU_URL"
          value = "http://gpu-service.internal:8000"
        }
      ]
    }
  ])
}
```

3. **Rebuild and redeploy:**

```bash
./scripts/build-and-push-free.sh
```

### Option B: Alternative - Remove Service Discovery

Even simpler - don't use service discovery at all. Services can communicate through security groups in the same VPC.

**Update `infra/terraform/ecs-free-tier.tf`:**

Remove all `service_registries` blocks and `aws_service_discovery_*` resources.

Then the services will communicate directly via task IPs (AWS handles this automatically in the same VPC).

## Fix #2: Increase Memory (Recommended)

Change all task definitions from 512MB to 1024MB:

```bash
# Edit infra/terraform/ecs-free-tier.tf
# Find and replace all:
memory = "512"

# With:
memory = "1024"
```

Then apply:

```bash
cd infra/terraform
terraform apply
```

**Cost Impact:** Still FREE (within 750 hours/month)

## Fix #3: Add Data Persistence (Optional - $15/month)

If you need data to persist, add a minimal RDS instance:

**Add to `infra/terraform/main-free-tier.tf`:**

```hcl
# Security group for RDS
resource "aws_security_group" "rds" {
  name   = "farlabs-rds-sg-free"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_services.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Database subnet group
resource "aws_db_subnet_group" "main" {
  name       = "farlabs-db-subnet-group-free"
  subnet_ids = aws_subnet.public[*].id
}

# Minimal RDS instance
resource "aws_db_instance" "postgres" {
  identifier              = "farlabs-postgres-free"
  engine                  = "postgres"
  engine_version          = "15.5"
  instance_class          = "db.t3.micro"  # ~$15/month
  allocated_storage       = 20
  storage_type            = "gp2"
  db_name                 = "farlabs"
  username                = "farlabs"
  password                = var.db_password
  vpc_security_group_ids  = [aws_security_group.rds.id]
  db_subnet_group_name    = aws_db_subnet_group.main.name
  backup_retention_period = 0  # No backups to save costs
  skip_final_snapshot     = true
  publicly_accessible     = false

  tags = {
    Name = "farlabs-database-free"
  }
}

# Add to variables.tf
variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = "change-me-in-production"
}
```

**New total cost:** ~$27/month (Redis $12 + RDS $15)

## Fix #4: Add HTTPS (Optional - FREE)

Use AWS Certificate Manager (free) for HTTPS:

```bash
# 1. Request certificate
aws acm request-certificate \
    --domain-name yourdomain.com \
    --validation-method DNS

# 2. Update ALB listener to use HTTPS
# Edit main-free-tier.tf, add:

resource "aws_lb_listener" "https_free" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_free.arn
  }
}
```

**Cost:** FREE (ACM certificates are free)

## Summary of Fixes

| Fix | Impact | Cost | Required? |
|-----|--------|------|-----------|
| Service Discovery | Makes it work | $0 | ✅ YES |
| Increase Memory | Better stability | $0 | ⭐ Recommended |
| Add RDS | Data persistence | +$15/mo | Optional |
| Add HTTPS | Secure connections | $0 | Optional |

## Quick Apply All Fixes

```bash
# 1. Fix service discovery
# Edit backend/api-gateway/main.py as shown above

# 2. Increase memory
sed -i '' 's/memory = "512"/memory = "1024"/g' infra/terraform/ecs-free-tier.tf

# 3. Apply changes
cd infra/terraform
terraform apply

# 4. Rebuild and redeploy
cd ../..
./scripts/build-and-push-free.sh
```

Done! 🎉

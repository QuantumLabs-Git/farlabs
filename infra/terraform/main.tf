# Far Labs - Free Tier / Minimal Cost Infrastructure
# This configuration uses only free-tier eligible or very low-cost services

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Comment out S3 backend for initial testing to avoid S3 costs
  # Uncomment after creating the bucket
  # backend "s3" {
  #   bucket = "farlabs-terraform-state"
  #   key    = "free-tier/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.region
}

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC (Free)
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "farlabs-vpc-free"
  }
}

# Internet Gateway (Free)
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "farlabs-igw-free"
  }
}

# Public Route Table (Free)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "farlabs-public-rt-free"
  }
}

# Public Subnets (Free) - Using public subnets to avoid NAT Gateway costs
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "farlabs-public-free-${count.index}"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group for ALB (Free)
resource "aws_security_group" "alb" {
  name        = "farlabs-alb-sg-free"
  description = "Allow HTTP from the world"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "HTTP"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "farlabs-alb-sg-free"
  }
}

# Security Group for ECS Services (Free)
resource "aws_security_group" "ecs_services" {
  name   = "farlabs-ecs-sg-free"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    from_port       = 8000
    to_port         = 9000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow internal communication
  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "farlabs-ecs-sg-free"
  }
}

# Security Group for RDS (Free)
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

  tags = {
    Name = "farlabs-rds-sg-free"
  }
}

# Security Group for Redis (Free)
resource "aws_security_group" "redis" {
  name   = "farlabs-redis-sg-free"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_services.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "farlabs-redis-sg-free"
  }
}

# Application Load Balancer (Free Tier: 750 hours/month)
resource "aws_lb" "main" {
  name               = "farlabs-alb-free"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false  # Easier to tear down for testing

  tags = {
    Name = "farlabs-alb-free"
  }
}

# ECS Cluster (Free)
resource "aws_ecs_cluster" "main" {
  name = "farlabs-cluster-free"

  setting {
    name  = "containerInsights"
    value = "disabled"  # Disable to save on CloudWatch costs
  }

  tags = {
    Name = "farlabs-cluster-free"
  }
}

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "farlabs-db-subnet-group-free"
  subnet_ids = aws_subnet.public[*].id

  tags = {
    Name = "farlabs-db-subnet-group-free"
  }
}

# RDS PostgreSQL - db.t3.micro (~$15/month)
resource "aws_db_instance" "postgres" {
  identifier              = "farlabs-postgres-free"
  engine                  = "postgres"
  engine_version          = "15.10"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  storage_type            = "gp2"
  db_name                 = "farlabs"
  username                = var.db_username
  password                = var.db_password
  vpc_security_group_ids  = [aws_security_group.rds.id]
  db_subnet_group_name    = aws_db_subnet_group.main.name

  # Cost optimizations
  backup_retention_period = 1  # Minimal backups
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  skip_final_snapshot    = true
  deletion_protection    = false
  publicly_accessible    = false

  # Single-AZ for cost savings
  multi_az = false

  # No encryption to avoid KMS costs
  storage_encrypted = false

  tags = {
    Name = "farlabs-postgres-free"
  }
}

# ElastiCache Redis - Smallest instance (cache.t3.micro is NOT free tier, but cheapest)
# Alternative: Run Redis in ECS (truly free, but less reliable)
resource "aws_elasticache_subnet_group" "main" {
  name       = "farlabs-redis-subnet-free"
  subnet_ids = aws_subnet.public[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "farlabs-redis-free"
  engine               = "redis"
  node_type            = "cache.t3.micro"  # Smallest: ~$12/month
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  # Disable snapshots to save costs
  snapshot_retention_limit = 0

  tags = {
    Name = "farlabs-redis-free"
  }
}

# S3 Buckets (Free Tier: 5GB storage, 20,000 GET requests, 2,000 PUT requests)
resource "aws_s3_bucket" "static_assets" {
  bucket = "farlabs-static-assets-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "farlabs-static-assets-free"
  }
}

resource "aws_s3_bucket" "model_storage" {
  bucket = "farlabs-model-storage-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "farlabs-model-storage-free"
  }
}

# Lifecycle policies to keep S3 usage minimal
resource "aws_s3_bucket_lifecycle_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    id     = "delete-old-files"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "model_storage" {
  bucket = aws_s3_bucket.model_storage.id

  rule {
    id     = "delete-old-files"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

# Data source for account ID
data "aws_caller_identity" "current" {}

# Outputs
output "alb_dns_name" {
  description = "Application Load Balancer DNS"
  value       = aws_lb.main.dns_name
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "rds_endpoint" {
  description = "PostgreSQL endpoint"
  value       = aws_db_instance.postgres.address
}

output "rds_database_name" {
  description = "PostgreSQL database name"
  value       = aws_db_instance.postgres.db_name
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = aws_ecs_cluster.main.name
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "http://${aws_lb.main.dns_name}"
}

output "database_connection_string" {
  description = "Database connection string"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/${aws_db_instance.postgres.db_name}"
  sensitive   = true
}

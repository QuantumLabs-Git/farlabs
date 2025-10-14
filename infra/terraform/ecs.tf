# Free Tier / Low Cost ECS Configuration for Far Labs
# This configuration minimizes costs while maintaining functionality

# ECS IAM Roles (same as before)
resource "aws_iam_role" "ecs_task_execution_role_free" {
  name = "farlabs-ecs-task-execution-role-free"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy_free" {
  role       = aws_iam_role.ecs_task_execution_role_free.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets_free" {
  name = "ecs-task-execution-secrets-free"
  role = aws_iam_role.ecs_task_execution_role_free.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "ssm:GetParameters",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task_role_free" {
  name = "farlabs-ecs-task-role-free"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# CloudWatch Log Groups (Free Tier: 5GB ingestion/month)
resource "aws_cloudwatch_log_group" "frontend_free" {
  name              = "/ecs/farlabs-frontend-free"
  retention_in_days = 1  # Minimize storage costs
}

resource "aws_cloudwatch_log_group" "api_gateway_free" {
  name              = "/ecs/farlabs-api-gateway-free"
  retention_in_days = 1
}

resource "aws_cloudwatch_log_group" "auth_free" {
  name              = "/ecs/farlabs-auth-free"
  retention_in_days = 1
}

resource "aws_cloudwatch_log_group" "payments_free" {
  name              = "/ecs/farlabs-payments-free"
  retention_in_days = 1
}

resource "aws_cloudwatch_log_group" "inference_free" {
  name              = "/ecs/farlabs-inference-free"
  retention_in_days = 1
}

resource "aws_cloudwatch_log_group" "inference_worker_free" {
  name              = "/ecs/farlabs-inference-worker-free"
  retention_in_days = 1
}

resource "aws_cloudwatch_log_group" "gpu_free" {
  name              = "/ecs/farlabs-gpu-free"
  retention_in_days = 1
}

# ECR Repositories (Free Tier: 500MB storage)
resource "aws_ecr_repository" "frontend_free" {
  name                 = "farlabs-frontend-free"
  image_tag_mutability = "MUTABLE"

  # Lifecycle policy to keep only 1 image
  image_scanning_configuration {
    scan_on_push = false  # Disable to save costs
  }
}

resource "aws_ecr_lifecycle_policy" "frontend_free" {
  repository = aws_ecr_repository.frontend_free.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only 1 image"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 1
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_repository" "api_gateway_free" {
  name                 = "farlabs-api-gateway-free"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }
}

resource "aws_ecr_lifecycle_policy" "api_gateway_free" {
  repository = aws_ecr_repository.api_gateway_free.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only 1 image"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 1
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_repository" "auth_free" {
  name                 = "farlabs-auth-free"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }
}

resource "aws_ecr_repository" "payments_free" {
  name                 = "farlabs-payments-free"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }
}

resource "aws_ecr_repository" "inference_free" {
  name                 = "farlabs-inference-free"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }
}

resource "aws_ecr_repository" "inference_worker_free" {
  name                 = "farlabs-inference-worker-free"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }
}

resource "aws_ecr_repository" "gpu_free" {
  name                 = "farlabs-gpu-free"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }
}

# ALB Target Groups
resource "aws_lb_target_group" "frontend_free" {
  name        = "farlabs-frontend-free-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 60  # Longer interval to reduce health check costs
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  deregistration_delay = 10
}

resource "aws_lb_target_group" "api_gateway_free" {
  name        = "farlabs-api-free-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 60
    matcher             = "200"
    path                = "/healthz"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  deregistration_delay = 10
}

# ALB Listeners
resource "aws_lb_listener" "http_free" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_free.arn
  }
}

resource "aws_lb_listener_rule" "api_free" {
  listener_arn = aws_lb_listener.http_free.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_gateway_free.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/healthz"]
    }
  }
}

# ECS Task Definitions (Minimal resources)
resource "aws_ecs_task_definition" "frontend_free" {
  family                   = "farlabs-frontend-free"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"  # Minimum
  memory                   = "512"  # Minimum
  execution_role_arn       = aws_iam_role.ecs_task_execution_role_free.arn
  task_role_arn            = aws_iam_role.ecs_task_role_free.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${aws_ecr_repository.frontend_free.repository_url}:latest"
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "NEXT_PUBLIC_API_URL"
          value = "http://${aws_lb.main.dns_name}"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend_free.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "api_gateway_free" {
  family                   = "farlabs-api-gateway-free"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role_free.arn
  task_role_arn            = aws_iam_role.ecs_task_role_free.arn

  container_definitions = jsonencode([
    {
      name  = "api-gateway"
      image = "${aws_ecr_repository.api_gateway_free.repository_url}:latest"
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "JWT_SECRET"
          value = "dev-secret-change-in-production"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api_gateway_free.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "auth_free" {
  family                   = "farlabs-auth-free"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role_free.arn
  task_role_arn            = aws_iam_role.ecs_task_role_free.arn

  container_definitions = jsonencode([
    {
      name  = "auth"
      image = "${aws_ecr_repository.auth_free.repository_url}:latest"
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "JWT_SECRET"
          value = "dev-secret-change-in-production"
        },
        {
          name  = "JWT_EXPIRES_MINUTES"
          value = "120"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.auth_free.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "payments_free" {
  family                   = "farlabs-payments-free"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role_free.arn
  task_role_arn            = aws_iam_role.ecs_task_role_free.arn

  container_definitions = jsonencode([
    {
      name  = "payments"
      image = "${aws_ecr_repository.payments_free.repository_url}:latest"
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.payments_free.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "inference_free" {
  family                   = "farlabs-inference-free"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role_free.arn
  task_role_arn            = aws_iam_role.ecs_task_role_free.arn

  container_definitions = jsonencode([
    {
      name  = "inference"
      image = "${aws_ecr_repository.inference_free.repository_url}:latest"
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379"
        },
        {
          name  = "JWT_SECRET"
          value = "dev-secret-change-in-production"
        },
        {
          name  = "BSC_RPC_URL"
          value = "https://bsc-dataseed.binance.org/"
        },
        {
          name  = "SKIP_PAYMENT_VALIDATION"
          value = "true"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.inference_free.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "inference_worker_free" {
  family                   = "farlabs-inference-worker-free"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role_free.arn
  task_role_arn            = aws_iam_role.ecs_task_role_free.arn

  container_definitions = jsonencode([
    {
      name  = "inference-worker"
      image = "${aws_ecr_repository.inference_worker_free.repository_url}:latest"
      environment = [
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.inference_worker_free.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "gpu_free" {
  family                   = "farlabs-gpu-free"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role_free.arn
  task_role_arn            = aws_iam_role.ecs_task_role_free.arn

  container_definitions = jsonencode([
    {
      name  = "gpu"
      image = "${aws_ecr_repository.gpu_free.repository_url}:latest"
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.gpu_free.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# Service Discovery
resource "aws_service_discovery_private_dns_namespace" "main_free" {
  name = "internal"
  vpc  = aws_vpc.main.id
}

resource "aws_service_discovery_service" "auth_free" {
  name = "auth-service"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main_free.id

    dns_records {
      ttl  = 10
      type = "A"
    }
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "payments_free" {
  name = "payments-service"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main_free.id

    dns_records {
      ttl  = 10
      type = "A"
    }
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "inference_free" {
  name = "inference-service"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main_free.id

    dns_records {
      ttl  = 10
      type = "A"
    }
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "gpu_free" {
  name = "gpu-service"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main_free.id

    dns_records {
      ttl  = 10
      type = "A"
    }
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

# ECS Services (1 instance each to minimize costs)
resource "aws_ecs_service" "frontend_free" {
  name            = "farlabs-frontend-free"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend_free.arn
  desired_count   = 1  # Single instance
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend_free.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http_free]
}

resource "aws_ecs_service" "api_gateway_free" {
  name            = "farlabs-api-free"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_gateway_free.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_gateway_free.arn
    container_name   = "api-gateway"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.http_free]
}

resource "aws_ecs_service" "auth_free" {
  name            = "farlabs-auth-free"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.auth_free.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = true
  }

  service_registries {
    registry_arn = aws_service_discovery_service.auth_free.arn
  }
}

resource "aws_ecs_service" "payments_free" {
  name            = "farlabs-payments-free"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.payments_free.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = true
  }

  service_registries {
    registry_arn = aws_service_discovery_service.payments_free.arn
  }
}

resource "aws_ecs_service" "inference_free" {
  name            = "farlabs-inference-free"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.inference_free.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = true
  }

  service_registries {
    registry_arn = aws_service_discovery_service.inference_free.arn
  }
}

resource "aws_ecs_service" "inference_worker_free" {
  name            = "farlabs-inference-worker-free"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.inference_worker_free.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = true
  }
}

resource "aws_ecs_service" "gpu_free" {
  name            = "farlabs-gpu-free"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.gpu_free.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = true
  }

  service_registries {
    registry_arn = aws_service_discovery_service.gpu_free.arn
  }
}

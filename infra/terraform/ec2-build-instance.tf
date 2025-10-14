# IAM Role and Instance Profile for EC2 build instance

resource "aws_iam_role" "ec2_build_role" {
  name = "farlabs-ec2-build-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "farlabs-ec2-build-role"
  }
}

# Attach ECR permissions
resource "aws_iam_role_policy" "ec2_build_ecr_policy" {
  name = "farlabs-ec2-build-ecr-policy"
  role = aws_iam_role.ec2_build_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Instance profile
resource "aws_iam_instance_profile" "ec2_build_profile" {
  name = "farlabs-ec2-build-profile"
  role = aws_iam_role.ec2_build_role.name
}

# Output the instance profile name
output "ec2_build_instance_profile" {
  description = "EC2 instance profile for build instance"
  value       = aws_iam_instance_profile.ec2_build_profile.name
}

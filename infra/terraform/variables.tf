variable "region" {
  description = "AWS region to deploy Far Labs infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "db_username" {
  description = "Master username for PostgreSQL"
  type        = string
  default     = "farlabs_admin"
}

variable "db_password" {
  description = "Master password for PostgreSQL"
  type        = string
  sensitive   = true
  default     = "ChangeMe123!"  # Change this before deploying
}

#!/bin/bash
set -e

# Far Labs - Database Initialization Script
# Initializes PostgreSQL database with required schema

echo "================================================"
echo "Far Labs - Database Initialization"
echo "================================================"
echo ""

# Get RDS endpoint from Terraform
cd "$(dirname "$0")/../infra/terraform"

if [ ! -f "terraform.tfstate" ]; then
    echo "Error: Terraform state not found. Please deploy infrastructure first."
    exit 1
fi

RDS_ENDPOINT=$(terraform output -raw rds_endpoint 2>/dev/null || echo "")
DB_NAME=$(terraform output -raw rds_database_name 2>/dev/null || echo "farlabs")

if [ -z "$RDS_ENDPOINT" ]; then
    echo "Error: Could not get RDS endpoint from Terraform."
    exit 1
fi

echo "RDS Endpoint: $RDS_ENDPOINT"
echo "Database: $DB_NAME"
echo ""

# Database credentials
DB_USER="${DB_USERNAME:-farlabs_admin}"
DB_PASS="${DB_PASSWORD:-ChangeMe123!}"

# Wait for database to be ready
echo "Waiting for database to be ready..."
for i in {1..30}; do
    if pg_isready -h "$RDS_ENDPOINT" -U "$DB_USER" > /dev/null 2>&1; then
        echo "✓ Database is ready"
        break
    fi
    echo "  Attempt $i/30: Database not ready yet..."
    sleep 10
done

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo ""
    echo "Error: psql command not found."
    echo "Please install PostgreSQL client:"
    echo "  - macOS: brew install postgresql"
    echo "  - Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  - Amazon Linux: sudo yum install postgresql"
    exit 1
fi

# Run initialization script
echo ""
echo "Running database initialization script..."

cd ../..

export PGPASSWORD="$DB_PASS"

psql -h "$RDS_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f backend/database/init.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Database initialized successfully!"
    echo ""

    # Show database stats
    echo "Database Statistics:"
    psql -h "$RDS_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT * FROM database_stats;"

    echo ""
    echo "Connection string (save this):"
    echo "postgresql://$DB_USER:$DB_PASS@$RDS_ENDPOINT:5432/$DB_NAME"
else
    echo ""
    echo "Error: Database initialization failed"
    exit 1
fi

unset PGPASSWORD

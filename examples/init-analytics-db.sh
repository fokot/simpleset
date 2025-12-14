#!/bin/bash

# Script to initialize the analytics database with sample data
# This script creates the monthly_data table and populates it with data
# that will be displayed in the Analytics Dashboard
#
# Usage: ./init-analytics-db.sh [DB_HOST] [DB_PORT] [DB_NAME] [DB_USER]
# Example: ./init-analytics-db.sh localhost 5432 postgres postgres

# Default configuration
DB_HOST="${1:-localhost}"
DB_PORT="${2:-5432}"
DB_NAME="${3:-postgres}"
DB_USER="${4:-postgres}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/init-analytics-data.sql"

echo "========================================="
echo "Analytics Database Initialization"
echo "========================================="
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "SQL File: $SQL_FILE"
echo "========================================="
echo ""

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "Error: SQL file not found: $SQL_FILE"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if PGPASSWORD=postgres psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
        echo "✓ PostgreSQL is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "  Attempt $attempt/$max_attempts - waiting..."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo "✗ Error: PostgreSQL is not responding after $max_attempts attempts"
    exit 1
fi

echo ""
echo "Executing SQL script..."
echo "========================================="

# Execute the SQL script
PGPASSWORD=postgres psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✓ Database initialization completed successfully!"
    echo "========================================="
    echo ""
    echo "You can now:"
    echo "  1. Start the backend server"
    echo "  2. Run ./init-data.sh http://localhost:8080 to create dashboards"
    echo "  3. Open the dashboard demo pages to see the charts with data"
    echo ""
else
    echo ""
    echo "========================================="
    echo "✗ Error: Database initialization failed"
    echo "========================================="
    exit 1
fi


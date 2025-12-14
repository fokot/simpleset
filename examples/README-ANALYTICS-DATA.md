# Analytics Dashboard Data Initialization

This directory contains scripts to initialize the PostgreSQL database with sample analytics data that will be displayed in the SimpleSet dashboards.

## Overview

The Analytics Dashboard and other dashboards query data from a PostgreSQL table called `monthly_data`. This table contains monthly sales and revenue data that powers all the charts and visualizations.

## Files

- **`init-analytics-data.sql`** - SQL script that creates the `monthly_data` table and inserts sample data
- **`init-analytics-db.sh`** - Shell script to execute the SQL script against PostgreSQL
- **`test-analytics-api.sh`** - Shell script to test that the API returns data correctly
- **`init-data.sh`** - Existing script to create dashboard definitions via the API

## Quick Start

### 1. Start PostgreSQL

Using Docker Compose (recommended):

```bash
cd backend
docker-compose up -d
```

Or use your own PostgreSQL instance running on `localhost:5432`.

### 2. Initialize the Analytics Data

Run the initialization script to create the table and insert sample data:

```bash
cd examples
./init-analytics-db.sh
```

This will:
- Create the `monthly_data` table
- Insert sample data for 2023 and 2024
- Display a summary of the inserted data

### 3. Start the Backend Server

```bash
cd backend
sbt run
```

The server will:
- Start on port 8080
- Automatically run `init-data.sh` to create dashboard definitions
- Register the `analytics-db` data source

### 4. Test the API

Verify that the API returns data correctly:

```bash
cd examples
./test-analytics-api.sh http://localhost:8080
```

This will test all the dashboard endpoints and chart data endpoints.

### 5. View the Dashboards

Open the demo pages in your browser:

- **Backend Demo**: `examples/dashboard-backend-demo.html`
- **ECharts Demo**: `examples/echarts-dashboard-demo.html`
- **API Documentation**: http://localhost:8080/docs/openapi

## Database Schema

### Table: `monthly_data`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `year` | INTEGER | Year (e.g., 2024) |
| `month` | VARCHAR(20) | Month name (e.g., "January") |
| `sales` | NUMERIC(10,2) | Sales amount |
| `revenue` | NUMERIC(10,2) | Revenue amount |
| `created_at` | TIMESTAMP | Record creation timestamp |

### Sample Data

The script inserts 12 months of data for both 2023 and 2024, showing growth trends:

- **2024 Sales**: Range from $45,000 (January) to $110,000 (December)
- **2024 Revenue**: Range from $125,000 (January) to $285,000 (December)
- **2023 Data**: Included for year-over-year comparisons

## Dashboard Queries

The dashboards use the following SQL queries:

### Analytics Dashboard

**Traffic Trend Chart:**
```sql
SELECT month, sales AS visitors, revenue AS pageviews 
FROM monthly_data 
WHERE year = 2024
```

**Device Breakdown Chart:**
```sql
SELECT month AS device, sales AS usage 
FROM monthly_data 
WHERE year = 2024 
LIMIT 3
```

### Sales Dashboard

**Revenue Chart:**
```sql
SELECT month, sales, revenue 
FROM monthly_data 
WHERE year = 2024
```

**Sales by Region Chart:**
```sql
SELECT month AS region, sales 
FROM monthly_data 
WHERE year = 2024
```

## Customization

### Adding More Data

Edit `init-analytics-data.sql` to add more data:

```sql
INSERT INTO monthly_data (year, month, sales, revenue) VALUES
    (2025, 'January', 115000.00, 295000.00),
    (2025, 'February', 120000.00, 305000.00);
```

### Connecting to a Different Database

Pass custom connection parameters to the initialization script:

```bash
./init-analytics-db.sh <host> <port> <database> <user>
```

Example:
```bash
./init-analytics-db.sh myhost.com 5432 analytics myuser
```

## Troubleshooting

### PostgreSQL Not Ready

If you see "PostgreSQL is not responding", ensure:
- PostgreSQL is running: `docker-compose ps` or `pg_isready`
- Port 5432 is accessible
- Credentials are correct (default: postgres/postgres)

### API Returns No Data

If charts show "Loading..." or no data:
1. Verify data exists: `psql -U postgres -c "SELECT * FROM monthly_data LIMIT 5;"`
2. Check backend logs for SQL errors
3. Verify the data source is registered: Check `Main.scala` line 42

### Permission Denied

Make scripts executable:
```bash
chmod +x init-analytics-db.sh test-analytics-api.sh
```

## Manual Database Operations

### Connect to PostgreSQL

```bash
psql -U postgres -d postgres
```

### View Data

```sql
SELECT * FROM monthly_data WHERE year = 2024 ORDER BY id;
```

### Drop and Recreate

```sql
DROP TABLE IF EXISTS monthly_data;
-- Then run init-analytics-db.sh again
```

## Next Steps

After initializing the data:

1. Explore the API documentation at http://localhost:8080/docs/openapi
2. Open `dashboard-backend-demo.html` to see live charts
3. Modify the SQL queries in dashboard definitions to create custom visualizations
4. Add your own data sources and dashboards


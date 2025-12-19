# SimpleSet Analytics Dashboard - Complete Setup Guide

This guide walks you through setting up the complete SimpleSet analytics dashboard system with real data from PostgreSQL.

## What Was Created

1. **SQL Script** (`init-analytics-data.sql`) - Creates and populates the `monthly_data` table
2. **Database Init Script** (`init-analytics-db.sh`) - Automates database initialization
3. **API Test Script** (`test-analytics-api.sh`) - Verifies the API returns data correctly
4. **Documentation** (`README-ANALYTICS-DATA.md`) - Comprehensive usage guide

## Quick Start (5 Minutes)

### Step 1: Start PostgreSQL

```bash
# Using local PostgreSQL (already running on port 5432)
# OR using Docker:
cd backend
docker-compose up -d
```

### Step 2: Initialize the Database

```bash
cd examples
./init-analytics-db.sh
```

**Expected Output:**
```
✓ PostgreSQL is ready!
✓ Database initialization completed successfully!
```

This creates the `monthly_data` table with:
- 12 months of data for 2024
- 12 months of data for 2023
- Columns: year, month, sales, revenue

### Step 3: Start the Backend Server

```bash
cd backend
sbt run
```

**Expected Output:**
```
Server started
Open http://localhost:8080/docs/openapi to view the API documentation
```

The server automatically:
- Creates dashboard definitions via `init-data.sh`
- Registers the `analytics-db` data source
- Connects to PostgreSQL

### Step 4: Test the API

```bash
cd examples
./test-analytics-api.sh http://localhost:8080
```

**Expected Output:**
```
✓ Status: 200 (OK) for all endpoints
```

### Step 5: View the Dashboards

Open in your browser:
- **Analytics Dashboard**: `examples/dashboard-backend-demo.html`
- **API Docs**: http://localhost:8080/docs/openapi

## What the Dashboards Show

### Analytics Dashboard

**Traffic Trend Chart:**
- Shows monthly visitors (sales) and pageviews (revenue) for 2024
- Data grows from 45K visitors in January to 110K in December

**Device Breakdown Chart:**
- Shows top 3 months of device usage
- Uses the first 3 months of 2024 data

### Sales Dashboard

**Revenue Chart:**
- Monthly sales and revenue trends
- Shows growth from $45K/$125K to $110K/$285K

**Sales by Region Chart:**
- Sales data by month (aliased as region)
- All 12 months of 2024

### Operations & Financial Dashboards

Similar charts using the same `monthly_data` table with different column aliases.

## API Endpoints

### List Dashboards
```bash
curl http://localhost:8080/dashboards
```

### Get Dashboard Definition
```bash
curl http://localhost:8080/dashboards/analytics-dashboard
```

### Get Chart Data
```bash
curl http://localhost:8080/data/analytics-dashboard/1/traffic-trend-chart
```

**Response Format:**
```json
[
  {
    "month": "January",
    "visitors": 45000.00,
    "pageviews": 125000.00
  },
  ...
]
```

## Database Schema

```sql
CREATE TABLE monthly_data (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month VARCHAR(20) NOT NULL,
    sales NUMERIC(10, 2) NOT NULL,
    revenue NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Sample Data

| Year | Month | Sales | Revenue |
|------|-------|-------|---------|
| 2024 | January | $45,000 | $125,000 |
| 2024 | February | $52,000 | $138,000 |
| ... | ... | ... | ... |
| 2024 | December | $110,000 | $285,000 |

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Check port 5432 is open
lsof -i :5432
```

### API Returns 404
- Ensure the backend server is running
- Check that `init-data.sh` completed successfully
- Verify data exists: `psql -U postgres -c "SELECT * FROM monthly_data LIMIT 5;"`

### Charts Show "Loading..."
- Open browser console (F12) to check for errors
- Verify the backend URL is correct in the HTML file
- Test the API endpoint directly with curl

## Next Steps

1. **Customize the Data**: Edit `init-analytics-data.sql` to add your own data
2. **Create New Dashboards**: Use the API to create custom dashboard definitions
3. **Add More Tables**: Create additional tables for different data sources
4. **Modify Queries**: Update the SQL in dashboard widgets to show different metrics

## Files Reference

- `examples/init-analytics-data.sql` - SQL schema and data
- `examples/init-analytics-db.sh` - Database initialization script
- `examples/test-analytics-api.sh` - API testing script
- `examples/init-data.sh` - Dashboard creation script
- `examples/dashboard-backend-demo.html` - Live dashboard demo
- `examples/README-ANALYTICS-DATA.md` - Detailed documentation

## Success Criteria

✅ PostgreSQL is running and accessible
✅ `monthly_data` table exists with 24 rows (12 for 2023, 12 for 2024)
✅ Backend server is running on port 8080
✅ All API endpoints return 200 status
✅ Dashboard HTML pages show charts with data

You're all set! 🎉


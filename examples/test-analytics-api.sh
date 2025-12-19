#!/bin/bash

# Script to test the Analytics Dashboard API endpoints
# This script verifies that the API returns data correctly after initialization
#
# Usage: ./test-analytics-api.sh [BASE_URL]
# Example: ./test-analytics-api.sh http://localhost:8080

# Configuration
BASE_URL="${1:-http://localhost:8080}"

echo "========================================="
echo "Analytics Dashboard API Test"
echo "========================================="
echo "Base URL: $BASE_URL"
echo "========================================="
echo ""

# Function to test an endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo "Testing: $description"
    echo "Endpoint: $endpoint"
    echo "---"
    
    response=$(curl -s -w "\n%{http_code}" "$endpoint")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo "✓ Status: $http_code (OK)"
        echo "Response preview:"
        echo "$body" | head -c 500
        if [ ${#body} -gt 500 ]; then
            echo "... (truncated)"
        fi
        echo ""
        echo ""
        return 0
    else
        echo "✗ Status: $http_code (FAILED)"
        echo "Response: $body"
        echo ""
        echo ""
        return 1
    fi
}

# Wait for server to be ready
echo "Waiting for server to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s "$BASE_URL/dashboards" &> /dev/null; then
        echo "✓ Server is ready!"
        echo ""
        break
    fi
    attempt=$((attempt + 1))
    echo "  Attempt $attempt/$max_attempts - waiting..."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo "✗ Error: Server is not responding after $max_attempts attempts"
    exit 1
fi

# Test 1: List all dashboards
test_endpoint "$BASE_URL/dashboards" "List all dashboards"

# Test 2: Get Analytics Dashboard by name
test_endpoint "$BASE_URL/dashboards/analytics-dashboard" "Get Analytics Dashboard"

# Test 3: Get dashboard data for traffic-trend-chart
# Note: We need to get the dashboard first to get the version ID
echo "Getting dashboard version ID..."
dashboard_response=$(curl -s "$BASE_URL/dashboards/analytics-dashboard")
version_id=$(echo "$dashboard_response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$version_id" ]; then
    echo "✗ Could not extract version ID from dashboard response"
    echo "Response: $dashboard_response"
    exit 1
fi

echo "✓ Dashboard version ID: $version_id"
echo ""

# Test 4: Get chart data for traffic-trend-chart
test_endpoint "$BASE_URL/data/analytics-dashboard/$version_id/traffic-trend-chart" \
    "Get data for Traffic Trend chart"

# Test 5: Get chart data for device-breakdown-chart
test_endpoint "$BASE_URL/data/analytics-dashboard/$version_id/device-breakdown-chart" \
    "Get data for Device Breakdown chart"

# Test 6: Get Sales Dashboard
test_endpoint "$BASE_URL/dashboards/sales-dashboard" "Get Sales Dashboard"

# Get Sales Dashboard version ID
sales_response=$(curl -s "$BASE_URL/dashboards/sales-dashboard")
sales_version_id=$(echo "$sales_response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$sales_version_id" ]; then
    echo "✓ Sales Dashboard version ID: $sales_version_id"
    echo ""
    
    # Test 7: Get chart data for revenue-chart
    test_endpoint "$BASE_URL/data/sales-dashboard/$sales_version_id/revenue-chart" \
        "Get data for Revenue chart"
    
    # Test 8: Get chart data for sales-by-region-chart
    test_endpoint "$BASE_URL/data/sales-dashboard/$sales_version_id/sales-by-region-chart" \
        "Get data for Sales by Region chart"
fi

echo "========================================="
echo "API Testing Complete!"
echo "========================================="
echo ""
echo "All endpoints tested. Check the output above for any failures."
echo ""
echo "To view the dashboards in a browser:"
echo "  - Analytics Dashboard: file://$(pwd)/examples/dashboard-backend-demo.html"
echo "  - API Documentation: $BASE_URL/docs/openapi"
echo ""


#!/bin/bash

# Script to initialize dashboards in the SimpleSet application
# This script creates sample dashboards by calling the POST /dashboards endpoint
# Usage: ./init-data.sh <BASE_URL>
# Example: ./init-data.sh http://localhost:8080

# Check if BASE_URL is provided as first parameter
if [ -z "$1" ]; then
  echo "Error: BASE_URL is required as the first parameter"
  echo "Usage: $0 <BASE_URL>"
  echo "Example: $0 http://localhost:8080"
  exit 1
fi

# Configuration
BASE_URL="$1"
ENDPOINT="$BASE_URL/dashboards"

echo "Initializing dashboards at $ENDPOINT..."
echo ""

# Function to create a dashboard
create_dashboard() {
  local name=$1
  local dashboard_json=$2

  echo "Creating dashboard: $name"

  response=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"dashboard\":$dashboard_json}")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq 200 ]; then
    echo "✓ Successfully created: $name"
  else
    echo "✗ Failed to create: $name (HTTP $http_code)"
    echo "  Response: $body"
    exit 1
  fi
}

# Analytics Dashboard
analytics_dashboard='{
                       "id": "analytics-dashboard",
                       "name": "Analytics Dashboard",
                       "description": "Website traffic and user analytics",
                       "layout": {
                         "type": "grid",
                         "columns": 12,
                         "rowHeight": 100
                       },
                       "theme": {
                         "name": "analytics",
                         "backgroundColor": "#ffffff",
                         "primaryColor": "#667eea",
                         "secondaryColor": "#764ba2",
                         "fontFamily": "Inter, system-ui, sans-serif",
                         "borderRadius": 8,
                         "spacing": 16
                       },
                       "sharing": {
                         "isPublic": true,
                         "allowedUsers": []
                       },
                       "widgets": [
                         {
                           "id": "traffic-trend-chart",
                           "title": "Traffic Trend (Auto-Loaded)",
                           "position": {
                             "x": 0,
                             "y": 0,
                             "width": 8,
                             "height": 4
                           },
                           "config": {
                             "type": "chart",
                             "dataBinding": {
                               "sql": "SELECT month, sales AS visitors, revenue AS pageviews FROM monthly_data WHERE year = 2024",
                               "dataSourceId": "analytics-db"
                             }
                           },
                           "visible": true
                         },
                         {
                           "id": "device-breakdown-chart",
                           "title": "Device Breakdown (Auto-Loaded)",
                           "position": {
                             "x": 8,
                             "y": 0,
                             "width": 4,
                             "height": 4
                           },
                           "config": {
                             "type": "chart",
                             "id": "chart-001",
                             "dataBinding": {
                               "sql": "SELECT month AS device, sales AS usage FROM monthly_data WHERE year = 2024 LIMIT 3",
                               "dataSourceId": "analytics-db"
                             }
                           },
                           "visible": true
                         }
                       ]
                     }'

# Sales Dashboard
sales_dashboard='{
  "id": "sales-dashboard",
  "name": "Sales Performance Dashboard",
  "description": "Sales metrics and revenue tracking",
  "layout": {
    "type": "grid",
    "columns": 12,
    "rowHeight": 100
  },
  "theme": {
    "name": "sales",
    "backgroundColor": "#ffffff",
    "primaryColor": "#4CAF50",
    "secondaryColor": "#2196F3",
    "fontFamily": "Inter, system-ui, sans-serif",
    "borderRadius": 8,
    "spacing": 16
  },
  "sharing": {
    "isPublic": true,
    "allowedUsers": []
  },
  "widgets": [
    {
      "id": "revenue-chart",
      "title": "Monthly Revenue (Auto-Loaded)",
      "position": {
        "x": 0,
        "y": 0,
        "width": 6,
        "height": 4
      },
      "config": {
        "type": "chart",
        "dataBinding": {
          "sql": "SELECT month, sales, revenue FROM monthly_data WHERE year = 2024",
          "dataSourceId": "analytics-db"
        }
      },
      "visible": true
    },
    {
      "id": "sales-by-region-chart",
      "title": "Sales by Region (Auto-Loaded)",
      "position": {
        "x": 6,
        "y": 0,
        "width": 6,
        "height": 4
      },
      "config": {
        "type": "chart",
        "dataBinding": {
          "sql": "SELECT month AS region, sales FROM monthly_data WHERE year = 2024",
          "dataSourceId": "analytics-db"
        }
      },
      "visible": true
    }
  ]
}'

# Operations Dashboard
operations_dashboard='{
  "id": "operations-dashboard",
  "name": "Operations Monitor",
  "description": "System performance and monitoring",
  "layout": {
    "type": "grid",
    "columns": 12,
    "rowHeight": 100
  },
  "theme": {
    "name": "operations",
    "backgroundColor": "#ffffff",
    "primaryColor": "#FF9800",
    "secondaryColor": "#F44336",
    "fontFamily": "Inter, system-ui, sans-serif",
    "borderRadius": 8,
    "spacing": 16
  },
  "sharing": {
    "isPublic": true,
    "allowedUsers": []
  },
  "widgets": [
    {
      "id": "server-load-chart",
      "title": "Server Load (Auto-Loaded)",
      "position": {
        "x": 0,
        "y": 0,
        "width": 12,
        "height": 4
      },
      "config": {
        "type": "chart",
        "dataBinding": {
          "sql": "SELECT month AS time, sales AS server1, revenue AS server2 FROM monthly_data WHERE year = 2024",
          "dataSourceId": "analytics-db"
        }
      },
      "visible": true
    }
  ]
}'

# Financial Dashboard
financial_dashboard='{
  "id": "financial-dashboard",
  "name": "Financial Overview",
  "description": "Financial metrics and reporting",
  "layout": {
    "type": "grid",
    "columns": 12,
    "rowHeight": 100
  },
  "theme": {
    "name": "financial",
    "backgroundColor": "#ffffff",
    "primaryColor": "#9C27B0",
    "secondaryColor": "#E91E63",
    "fontFamily": "Inter, system-ui, sans-serif",
    "borderRadius": 8,
    "spacing": 16
  },
  "sharing": {
    "isPublic": true,
    "allowedUsers": []
  },
  "widgets": [
    {
      "id": "profit-loss-chart",
      "title": "Profit & Loss (Auto-Loaded)",
      "position": {
        "x": 0,
        "y": 0,
        "width": 8,
        "height": 4
      },
      "config": {
        "type": "chart",
        "dataBinding": {
          "sql": "SELECT month AS quarter, sales AS revenue, revenue AS expenses FROM monthly_data WHERE year = 2024",
          "dataSourceId": "analytics-db"
        }
      },
      "visible": true
    },
    {
      "id": "cash-flow-chart",
      "title": "Cash Flow (Auto-Loaded)",
      "position": {
        "x": 8,
        "y": 0,
        "width": 4,
        "height": 4
      },
      "config": {
        "type": "chart",
        "dataBinding": {
          "sql": "SELECT month, revenue AS cashFlow FROM monthly_data WHERE year = 2024",
          "dataSourceId": "analytics-db"
        }
      },
      "visible": true
    }
  ]
}'

# Create all dashboards
create_dashboard "analytics-dashboard" "$analytics_dashboard"
create_dashboard "sales-dashboard" "$sales_dashboard"
create_dashboard "operations-dashboard" "$operations_dashboard"
create_dashboard "financial-dashboard" "$financial_dashboard"

echo "Dashboard initialization complete!"


# SimpleSet Backend

A Scala 3 ZIO-HTTP server that provides REST API endpoints for the SimpleSet application.

## Features

- Built with Scala 3 and ZIO-HTTP
- JSON serialization using zio-json
- CORS support for frontend integration
- RESTful API endpoints

## API Endpoints

### GET /dashboards
Returns a list of available dashboards as JSON.

**Response:**
```json
[
  "Sales Dashboard",
  "Marketing Analytics", 
  "User Engagement",
  "Financial Overview",
  "System Performance"
]
```

## Running the Server

### Prerequisites
- Java 11 or higher
- SBT (Scala Build Tool)

### Development
```bash
# Run the server
sbt run

# Run tests
sbt test

# Compile
sbt compile

# Check for dependency updates
sbt dependencyUpdates

# Update dependencies (after reviewing the output above)
# Edit build.sbt manually with the new versions
```

The server will start on port 8080 by default.

### Testing the API
```bash
# Test the dashboards endpoint
curl http://localhost:8080/dashboards
```

## Project Structure

```
backend/
├── build.sbt                 # Build configuration
├── project/
│   ├── build.properties     # SBT version
│   └── plugins.sbt          # SBT plugins
└── src/
    ├── main/scala/com/simpleset/
    │   └── Main.scala        # Main application
    └── test/scala/com/simpleset/
        └── MainSpec.scala    # Tests
```

## SBT Plugins

- **sbt-updates**: Checks for newer versions of dependencies
  - Usage: `sbt dependencyUpdates`
  - Helps keep dependencies up to date

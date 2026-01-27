# External Integrations

**Analysis Date:** 2027-01-27

## APIs & External Services

**Self-hosted REST API:**
- Backend exposes REST endpoints on port 8080
- OpenAPI/Swagger UI available at `/docs/openapi`
- CORS enabled for all origins (development mode)

**API Endpoints (`backend/src/main/scala/com/simpleset/Api.scala`):**
- `GET /dashboards` - List all dashboards
- `POST /dashboards` - Create/update dashboard
- `GET /dashboards/:name` - Get dashboard by name
- `GET /dashboards/id/:id` - Get dashboard by ID
- `POST /data` - Execute chart data queries

**API Type Definitions (`api/`):**
- `api/endpoints.ts` - Endpoint specifications with Zod schemas
- `api/datasources.ts` - Data source types
- `api/queries.ts` - Query types
- `api/charts.ts` - Chart types
- `api/dashboards.ts` - Dashboard types

## Data Storage

**Primary Database:**
- PostgreSQL 18 (via Docker)
- Connection: `jdbc:postgresql://localhost:5432/postgres`
- Client: HikariCP connection pool + Magnum ZIO
- Driver: `org.postgresql.Driver`

**Connection Pool Settings (`backend/src/main/scala/com/simpleset/datasource/PostgresDataSource.scala`):**
- Max pool size: 10
- Min idle: 2
- Connection timeout: 30s
- Idle timeout: 10min
- Max lifetime: 30min

**File Storage:**
- Local filesystem only (no cloud storage detected)

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- None detected
- CORS allows all origins (development configuration)

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- ZIO Console for server output
- ZIO Debug for query debugging
- Standard JVM logging

## CI/CD & Deployment

**Hosting:**
- Not configured
- Development server on port 8080

**CI Pipeline:**
- No GitHub Actions or CI configuration detected

**Docker (`examples/docker-compose.yml`):**
- PostgreSQL 18 service for development
- Initializes with `init-analytics-data.sql`
- Exposed on port 5432

## Environment Configuration

**Backend Hardcoded Defaults (`backend/src/main/scala/com/simpleset/Main.scala`):**
- Server port: 8080
- Database URL: `jdbc:postgresql://localhost:5432/postgres`
- Database user: `postgres`
- Database password: `postgres`

**Required env vars:**
- None (currently hardcoded)

**Secrets location:**
- Hardcoded in source (development only)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Data Source Registry

**Dynamic Data Sources (`backend/src/main/scala/com/simpleset/datasource/`):**
- `DataSourceRegistry.scala` - Manages named data sources
- `DataSource.scala` - Base trait for data sources
- `PostgresDataSource.scala` - PostgreSQL implementation

**Query Execution:**
- SQL queries with parameter substitution (`{{paramName}}` syntax)
- Results returned as JSON
- SQL injection protection via string escaping

---

*Integration audit: 2027-01-27*


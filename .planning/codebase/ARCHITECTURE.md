# Architecture

**Analysis Date:** 2026-01-27

## Pattern Overview

**Overall:** Monorepo with Full-Stack Dashboard Platform (Scala Backend + TypeScript Web Components)

**Key Characteristics:**
- Separate frontend (Lit Web Components) and backend (ZIO HTTP Scala)
- API schema definitions in TypeScript with Zod for type validation
- Dashboard-driven architecture with widget-based rendering
- Data source abstraction for querying external databases

## Layers

**API Schema Layer:**
- Purpose: Define typed API contracts and validation schemas
- Location: `api/`
- Contains: Zod schemas for dashboards, charts, queries, datasources
- Depends on: Zod library
- Used by: Frontend components (types mirrored locally), Backend (conceptually)

**Frontend Layer:**
- Purpose: Render dashboards using Lit Web Components
- Location: `frontend/src/`
- Contains: Dashboard component, widget components, type definitions
- Depends on: Lit, ECharts, API types
- Used by: HTML demo pages in `examples/`

**Backend API Layer:**
- Purpose: HTTP API endpoints using ZIO HTTP
- Location: `backend/src/main/scala/com/simpleset/Api.scala`
- Contains: REST endpoints for dashboards and data queries
- Depends on: Backend, DataSourceRegistry
- Used by: Frontend dashboard components

**Backend Domain Layer:**
- Purpose: Business logic and data persistence abstraction
- Location: `backend/src/main/scala/com/simpleset/dashboard/`
- Contains: Backend trait, InMemoryBackend, PostgresBackend implementations
- Depends on: Model layer
- Used by: API layer

**DataSource Layer:**
- Purpose: Abstract data source connections for query execution
- Location: `backend/src/main/scala/com/simpleset/datasource/`
- Contains: DataSource trait, PostgresDataSource, DataSourceRegistry
- Depends on: PostgreSQL JDBC, ZIO
- Used by: API layer for data queries

**Model Layer:**
- Purpose: Core domain models and data structures
- Location: `backend/src/main/scala/com/simpleset/model.scala`
- Contains: DashboardVersion, DataBinding, Chart, request/response types
- Depends on: ZIO Schema, ZIO JSON
- Used by: All backend layers

## Data Flow

**Dashboard Rendering Flow:**

1. HTML page embeds `<dashboard-component>` with `backend-base-url` and `dashboard-name`
2. Component fetches dashboard definition from `GET /dashboards/:name`
3. For each chart widget with dataBinding, component POSTs to `/data` endpoint
4. Backend resolves dataBinding, executes SQL via DataSourceRegistry
5. Component transforms data and renders widgets (charts, tables, metrics, filters)

**State Management:**
- Frontend: Lit reactive properties and internal `@state` decorators
- Backend: ZIO effects with STM-based DataSourceRegistry
- Dashboards stored via Backend trait (in-memory or PostgreSQL)

## Key Abstractions

**Backend Trait:**
- Purpose: Abstract dashboard persistence operations
- Examples: `backend/src/main/scala/com/simpleset/dashboard/Backend.scala`
- Pattern: Interface with multiple implementations (InMemory, Postgres)

**DataSource Trait:**
- Purpose: Abstract data query execution across different databases
- Examples: `backend/src/main/scala/com/simpleset/datasource/DataSource.scala`
- Pattern: Strategy pattern with registry-based lookup

**DashboardWidget:**
- Purpose: Configurable visual component in a dashboard
- Examples: `frontend/src/types/dashboard-types.ts`, `api/dashboards.ts`
- Pattern: Discriminated union by widget type

## Entry Points

**Backend Application:**
- Location: `backend/src/main/scala/com/simpleset/Main.scala`
- Triggers: `sbt run` command
- Responsibilities: Start ZIO HTTP server, initialize services, register data sources

**Frontend Widgets:**
- Location: `frontend/src/widgets/index.ts`
- Triggers: Imported by dashboard-component
- Responsibilities: Register all custom widget elements

**Demo Pages:**
- Location: `examples/*.html`
- Triggers: Browser HTTP request via dev server
- Responsibilities: Demonstrate component usage and backend integration

## Error Handling

**Strategy:** ZIO effect-based error handling with typed errors

**Patterns:**
- API endpoints map errors to `ErrorResponse` type
- Frontend components track errors in `_errors` Map by widget ID
- Validation errors displayed inline in widget containers

## Cross-Cutting Concerns

**Logging:** Console logging in frontend, ZIO Debug in backend
**Validation:** Zod schemas in `api/`, ZIO Schema in backend models
**Authentication:** CORS enabled for all origins (development mode), no auth implemented


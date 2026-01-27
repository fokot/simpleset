# Codebase Structure

**Analysis Date:** 2026-01-27

## Directory Layout

```
simpleset/
├── api/                    # TypeScript API schema definitions (Zod)
├── backend/                # Scala ZIO HTTP backend application
│   ├── src/main/scala/     # Main source code
│   ├── src/test/scala/     # Test source code
│   ├── project/            # SBT build configuration
│   └── build.sbt           # SBT dependencies
├── frontend/               # Lit Web Components (TypeScript)
│   ├── src/                # Component source code
│   ├── dist/               # Built output (generated)
│   └── package.json        # NPM dependencies
├── examples/               # Demo HTML pages and setup scripts
├── .planning/              # GSD planning documents
└── readme.md               # Project documentation
```

## Directory Purposes

**api/:**
- Purpose: Shared API contract definitions
- Contains: Zod schemas for dashboards, charts, queries, datasources, common types
- Key files: `dashboards.ts`, `charts.ts`, `queries.ts`, `datasources.ts`, `common.ts`

**backend/:**
- Purpose: Scala 3 ZIO HTTP server for dashboard API
- Contains: REST endpoints, domain logic, data source integrations
- Key files: `src/main/scala/com/simpleset/Main.scala`, `src/main/scala/com/simpleset/Api.scala`

**backend/src/main/scala/com/simpleset/dashboard/:**
- Purpose: Dashboard persistence backends
- Contains: Backend trait and implementations
- Key files: `Backend.scala`, `InMemoryBackend.scala`, `PostgresBackend.scala`

**backend/src/main/scala/com/simpleset/datasource/:**
- Purpose: Data source abstraction and implementations
- Contains: DataSource trait, PostgresDataSource, registry
- Key files: `DataSource.scala`, `PostgresDataSource.scala`, `DataSourceRegistry.scala`

**frontend/src/:**
- Purpose: Lit-based web components for dashboards
- Contains: Main components, widget implementations, type definitions
- Key files: `dashboard-component.ts`, `element-editor-component.ts`

**frontend/src/widgets/:**
- Purpose: Individual widget type implementations
- Contains: Chart, table, metric, filter, text widget components
- Key files: `chart-widget.ts`, `table-widget.ts`, `metric-widget.ts`, `filter-widget.ts`, `index.ts`

**frontend/src/types/:**
- Purpose: Local TypeScript type definitions
- Contains: Dashboard and widget types mirrored from API
- Key files: `dashboard-types.ts`

**examples/:**
- Purpose: Demo pages and initialization scripts
- Contains: HTML demos, SQL init scripts, Docker Compose for Postgres
- Key files: `dashboard-backend-demo.html`, `docker-compose.yml`, `init-data.sh`

## Key File Locations

**Entry Points:**
- `backend/src/main/scala/com/simpleset/Main.scala`: Backend server entry
- `frontend/src/widgets/index.ts`: Widget barrel export
- `examples/index.html`: Frontend demo entry

**Configuration:**
- `backend/build.sbt`: Scala dependencies and build settings
- `frontend/package.json`: NPM dependencies and scripts
- `frontend/rollup.config.js`: Frontend bundler configuration (if exists)

**Core Logic:**
- `backend/src/main/scala/com/simpleset/Api.scala`: REST API routes
- `backend/src/main/scala/com/simpleset/model.scala`: Domain models
- `frontend/src/dashboard-component.ts`: Main dashboard renderer

**Testing:**
- `backend/src/test/scala/com/simpleset/ModelSpec.scala`: Model tests
- `backend/src/test/scala/com/simpleset/dashboard/InMemoryBackendSpec.scala`: Backend tests

## Naming Conventions

**Files:**
- TypeScript/JS: kebab-case with component suffix (`dashboard-component.ts`, `chart-widget.ts`)
- Scala: PascalCase matching class name (`Api.scala`, `Backend.scala`, `DataSource.scala`)
- Exception: `model.scala` is lowercase (contains object with nested types)

**Directories:**
- Lowercase with hyphens for frontend (`widgets/`, `types/`)
- Package structure for Scala (`com/simpleset/dashboard/`, `com/simpleset/datasource/`)

## Where to Add New Code

**New Widget Type:**
- Implementation: `frontend/src/widgets/{name}-widget.ts`
- Export: Add import to `frontend/src/widgets/index.ts`
- Types: Add config to `frontend/src/types/dashboard-types.ts` and `api/dashboards.ts`

**New API Endpoint:**
- Endpoint definition: `backend/src/main/scala/com/simpleset/Api.scala`
- Add to openAPI and routes

**New Data Source:**
- Implementation: `backend/src/main/scala/com/simpleset/datasource/{Name}DataSource.scala`
- Register in `Main.scala`

**New Backend Implementation:**
- Implementation: `backend/src/main/scala/com/simpleset/dashboard/{Name}Backend.scala`
- Tests: `backend/src/test/scala/com/simpleset/dashboard/{Name}BackendSpec.scala`

**Utilities:**
- Backend: Add to existing files or create new file in appropriate package
- Frontend: Create in `frontend/src/` with descriptive name

## Special Directories

**frontend/dist/:**
- Purpose: Compiled frontend bundle output
- Generated: Yes (via `pnpm build`)
- Committed: No (should be in .gitignore)

**backend/target/:**
- Purpose: SBT build output and caches
- Generated: Yes
- Committed: No (should be in .gitignore)

**examples/frontend/:**
- Purpose: Copied frontend assets for demo serving
- Generated: Possibly
- Committed: Check project conventions

---

*Structure analysis: 2026-01-27*


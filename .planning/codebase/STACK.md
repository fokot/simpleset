# Technology Stack

**Analysis Date:** 2027-01-27

## Languages

**Primary:**
- Scala 3.7.2 - Backend API and business logic (`backend/src/`)
- TypeScript 5.9.2 - Frontend web components (`frontend/src/`)

**Secondary:**
- JavaScript - Simple hello component, config files (`frontend/src/hello-component.js`)
- SQL - Database queries and initialization (`examples/init-analytics-data.sql`)
- Shell - Build and initialization scripts (`examples/*.sh`)

## Runtime

**Backend:**
- JVM (Scala 3.7.2)
- sbt 1.11.6 (build tool)

**Frontend:**
- Node.js (ES2020 target)
- pnpm 9.0.0 (package manager)
- Lockfile: present (`frontend/pnpm-lock.yaml`)

## Frameworks

**Core:**
- ZIO 2.1.22 - Scala functional effect system (`backend/build.sbt`)
- ZIO-HTTP 3.5.1 - HTTP server framework (`backend/build.sbt`)
- Lit 3.1.0 - Web components library (`frontend/package.json`)

**Testing:**
- ZIO Test 2.1.22 - Backend unit testing (`backend/build.sbt`)
- No frontend testing framework detected

**Build/Dev:**
- Rollup 4.9.0 - Frontend bundler (`frontend/rollup.config.js`)
- sbt 1.11.6 - Scala build tool (`backend/project/build.properties`)

## Key Dependencies

**Backend (Critical):**
- `zio` 2.1.22 - Core effect system
- `zio-http` 3.5.1 - HTTP server with endpoints, OpenAPI generation
- `zio-json` 0.7.45 - JSON serialization/deserialization
- `zio-schema` 1.7.5 - Schema derivation for API types
- `magnumzio` 2.0.0-M2 - Database access (Magnum ZIO)
- `postgresql` 42.7.8 - PostgreSQL JDBC driver
- `HikariCP` 7.0.2 - Database connection pooling

**Frontend (Critical):**
- `lit` 3.1.0 - Web component library with reactive properties
- `echarts` 6.0.0 - Charting library for visualizations

**Build Tools:**
- `@rollup/plugin-typescript` 12.1.4 - TypeScript compilation
- `@rollup/plugin-node-resolve` 15.2.3 - Module resolution
- `@rollup/plugin-terser` 0.4.4 - Minification
- `tslib` 2.8.1 - TypeScript runtime helpers

## Configuration

**TypeScript (`frontend/tsconfig.json`):**
- Target: ES2020
- Module: ESNext
- Strict mode: disabled
- Experimental decorators: enabled (for Lit)
- Source maps: enabled

**Build (`frontend/rollup.config.js`):**
- Multiple entry points: `hello-component.js`, `dashboard-component.ts`, `element-editor-component.ts`
- ES module output format
- Browser-targeted bundling

**Backend (`backend/build.sbt`):**
- Fork on run enabled
- ZIO Test framework configured

## Platform Requirements

**Development:**
- JDK (Scala 3 compatible, likely JDK 11+)
- Node.js with pnpm 9.0.0
- sbt 1.11.6
- Docker (for PostgreSQL via `examples/docker-compose.yml`)

**Production:**
- JVM runtime for backend
- PostgreSQL 18 database
- Static file hosting for frontend bundles
- No specific deployment target detected

---

*Stack analysis: 2027-01-27*


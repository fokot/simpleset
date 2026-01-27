# Codebase Concerns

**Analysis Date:** 2026-01-27

## Tech Debt

**SQL Parameter Substitution (Potential SQL Injection Risk):**
- Issue: Parameter substitution uses string replacement with basic escaping instead of parameterized queries
- Files: `backend/src/main/scala/com/simpleset/datasource/PostgresDataSource.scala` (lines 80-106)
- Impact: Single quote escaping may not cover all SQL injection vectors; FIXME comment at line 80 indicates incomplete implementation
- Fix approach: Use JDBC prepared statements with proper parameter binding instead of string replacement

**Hardcoded Database Credentials:**
- Issue: Database connection hardcoded in Main.scala with default postgres credentials
- Files: `backend/src/main/scala/com/simpleset/Main.scala` (lines 37-41)
- Impact: Security risk in production; not environment-configurable
- Fix approach: Use environment variables or configuration file for database credentials

**Backend Data Source API Not Typed:**
- Issue: FIXME indicates need to add typed API for data source editing according to Zod definitions
- Files: `backend/src/main/scala/com/simpleset/dashboard/Backend.scala` (line 18)
- Impact: API inconsistency between frontend schema definitions and backend implementation
- Fix approach: Generate Scala types from Zod schemas in `api/datasources.ts` or vice versa

**Excessive `any` Types in Frontend:**
- Issue: Many `any` type annotations throughout TypeScript code
- Files: `frontend/src/types/dashboard-types.ts`, `frontend/src/dashboard-component.ts`, `frontend/src/element-editor-component.ts`, `frontend/src/widgets/chart-widget.ts`
- Impact: Loss of type safety, potential runtime errors not caught at compile time
- Fix approach: Define proper interfaces for data structures, chart options, and widget configurations

**CORS Allow-All Configuration:**
- Issue: FIXME at line 31 indicates CORS config allows all origins
- Files: `backend/src/main/scala/com/simpleset/Main.scala` (lines 28-32)
- Impact: Security vulnerability in production; any origin can make requests
- Fix approach: Configure allowed origins based on environment (strict for production)

## Known Bugs

**Missing Collision Visual Feedback:**
- Symptoms: TODO comment indicates visual feedback for widget collision not implemented
- Files: `frontend/src/element-editor-component.ts` (line 266)
- Trigger: Attempting to place widget where another widget exists
- Workaround: Console warning logged but no visual indicator

## Security Considerations

**SQL Injection Prevention:**
- Risk: Parameter substitution may be vulnerable to advanced SQL injection techniques
- Files: `backend/src/main/scala/com/simpleset/datasource/PostgresDataSource.scala` (lines 94-106)
- Current mitigation: Basic single quote escaping via `escapeSqlString`
- Recommendations: Use parameterized prepared statements; validate parameter names against expected values

**Password Storage in Configuration:**
- Risk: Database passwords stored in plain text in configuration
- Files: `api/datasources.ts` (defines password field), `backend/src/main/scala/com/simpleset/datasource/PostgresDataSource.scala`
- Current mitigation: None observed
- Recommendations: Use secret management (HashiCorp Vault, AWS Secrets Manager) or encrypted config

**Exception Throwing in Data Access:**
- Risk: Exceptions expose internal error messages to API consumers
- Files: `backend/src/main/scala/com/simpleset/dashboard/PostgresBackend.scala` (lines 86, 96)
- Current mitigation: Error mapped to ErrorResponse but message exposed
- Recommendations: Log full error internally, return sanitized messages to clients

## Performance Bottlenecks

**No Query Result Caching:**
- Problem: Every data request executes a fresh database query
- Files: `backend/src/main/scala/com/simpleset/datasource/PostgresDataSource.scala`
- Cause: No caching layer between API and database
- Improvement path: Add Redis or in-memory cache for query results with TTL

**Large Frontend Components:**
- Problem: Single files with 600+ lines of code
- Files: `frontend/src/element-editor-component.ts` (665 lines), `frontend/src/widgets/chart-widget.ts` (612 lines), `frontend/src/dashboard-component.ts` (537 lines)
- Cause: All component logic in single files
- Improvement path: Extract reusable logic into separate modules/mixins

## Fragile Areas

**Dashboard Data Transformation:**
- Files: `frontend/src/dashboard-component.ts` (lines 325-348)
- Why fragile: Data transformation assumes specific column structure; returns null on edge cases
- Safe modification: Add comprehensive null checks and data validation
- Test coverage: No frontend tests exist

**Widget Editor Drag/Drop:**
- Files: `frontend/src/element-editor-component.ts` (lines 391-507)
- Why fragile: Complex mouse event handling with global state management
- Safe modification: Thorough manual testing required for any changes
- Test coverage: No frontend tests

## Scaling Limits

**In-Memory Dashboard Storage:**
- Current capacity: All dashboards stored in memory via `InMemoryBackend`
- Limit: Memory exhaustion with many dashboards; data loss on restart
- Scaling path: `PostgresBackend` exists as alternative; make storage configurable

**Single Data Source per Query:**
- Current capacity: One data source per chart query
- Limit: Cannot join data across different data sources
- Scaling path: Consider federated query support or data warehousing

## Dependencies at Risk

**None Critical:** Dependencies appear maintained and current (ZIO 2.x, Lit 3.x, ECharts 6.x)

## Missing Critical Features

**Authentication/Authorization:**
- Problem: No user authentication or authorization system
- Blocks: Cannot restrict dashboard access, no audit trail, no user management

**Data Source Management API:**
- Problem: Data sources registered programmatically in `Main.scala`
- Blocks: Cannot add/edit/delete data sources at runtime

**Dashboard Versioning/History:**
- Problem: No version history for dashboards
- Blocks: Cannot rollback changes, no change audit

## Test Coverage Gaps

**No Frontend Tests:**
- What's not tested: All frontend components, widgets, and user interactions
- Files: `frontend/src/*`
- Risk: UI regressions undetected; refactoring dangerous
- Priority: High

**Limited Backend Tests:**
- What's not tested: PostgresBackend, PostgresDataSource, API routes, error handling
- Files: Only `backend/src/test/scala/com/simpleset/ModelSpec.scala` and `InMemoryBackendSpec.scala` exist
- Risk: Database integration issues undetected
- Priority: Medium

**No Integration Tests:**
- What's not tested: End-to-end flows, API-to-database, frontend-to-backend
- Files: No integration test files
- Risk: System-level regressions
- Priority: Medium

---

*Concerns audit: 2026-01-27*


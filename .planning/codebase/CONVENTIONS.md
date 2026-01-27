# Coding Conventions

**Analysis Date:** 2026-01-27

## Project Structure

This is a multi-language monorepo with three primary components:
- **frontend/**: TypeScript + Lit web components (pnpm, Rollup)
- **backend/**: Scala 3 + ZIO backend (sbt)
- **api/**: TypeScript type definitions with Zod schemas

## Naming Patterns

**Files:**
- TypeScript: `kebab-case.ts` (e.g., `dashboard-component.ts`, `chart-widget.ts`)
- Scala: `PascalCase.scala` (e.g., `Api.scala`, `InMemoryBackend.scala`)
- API Types: `kebab-case.ts` with lowercase names (e.g., `dashboards.ts`, `common.ts`)

**Classes/Types:**
- TypeScript: PascalCase for classes (`DashboardComponent`, `ChartWidget`)
- Scala: PascalCase for classes/traits/objects (`Backend`, `InMemoryBackend`, `DashboardVersion`)
- Scala case classes: PascalCase with companion objects containing `given Schema[T]`

**Functions/Methods:**
- TypeScript: camelCase for public, `_camelCase` with underscore prefix for private (`_loadDataFromBackend`, `_renderWidget`)
- Scala: camelCase (`getDashboards`, `saveDashboard`, `findDataBindings`)

**Variables:**
- TypeScript: camelCase, underscore prefix for private state (`_filterParams`, `_loadedData`)
- Scala: camelCase (`backend`, `dataSourceRegistry`)

**Constants:**
- TypeScript: SCREAMING_SNAKE_CASE for HTTP codes (`HttpStatusCodes`)
- TypeScript enums: Use Zod schemas with literal values

## Code Style

**Formatting:**
- TypeScript: No explicit Prettier/ESLint config detected - use TypeScript defaults
- Scala: No scalafmt config detected - follow standard Scala formatting
- Indentation: 2 spaces (TypeScript), 2 spaces (Scala)

**TypeScript Compiler Settings** (`frontend/tsconfig.json`):
- Target: ES2020
- Module: ESNext
- Strict mode: Disabled (`strict: false`, `noImplicitAny: false`)
- Decorators enabled: `experimentalDecorators: true`
- `noImplicitReturns: true` and `noFallthroughCasesInSwitch: true` are enabled

## Import Organization

**TypeScript Order:**
1. External libraries (`lit`, `echarts`, `zod`)
2. Relative imports with `.js` extension for Lit components (`'./types/dashboard-types.js'`)

**Scala Order:**
1. Project imports (`com.simpleset.*`)
2. ZIO imports (`zio.*`, `zio.json.*`, `zio.http.*`)
3. Java imports (`java.time.*`)

## Error Handling

**TypeScript Patterns:**
- Try-catch with async/await for fetch operations
- Error state stored in Maps: `this._errors: Map<string, string>`
- Console.error for logging errors
- Display error messages in UI with dedicated error message classes

**Scala Patterns:**
- ZIO effects with `Task[T]` return types
- `mapError` to transform errors into response types (`ErrorResponse`)
- Pattern matching on `Exit.Failure(cause)` in tests
- Custom exceptions: `NoSuchElementException` for not found cases

## Logging

**Framework:** 
- TypeScript: `console.log`, `console.error`, `console.warn`
- Scala: `ZIO.debug` for debug logging

**Patterns:**
- Log operation start with context (e.g., `Fetching data for widget ${widget.id}`)
- Log received data for debugging
- Warn on incomplete configurations

## Comments

**When to Comment:**
- Use comments for type definitions and widget documentation
- Block comments for section headers in API files (`// ============================================================================`)

**JSDoc/TSDoc:**
- Limited usage - primarily in API schema files with `@description` via Zod `.describe()`

## Function Design

**Size:** 
- Keep functions focused - typically 10-50 lines
- Extract helper methods (e.g., `_generateBarChartOptions`, `_transformBackendData`)

**Parameters:**
- TypeScript: Use object parameters for complex configs
- Scala: Use case classes for request/response types

**Return Values:**
- TypeScript: Return `Promise<void>` for async operations, use state for results
- Scala: Return `Task[T]` for effectful operations

## Module Design

**Exports:**
- TypeScript: Named exports for types and schemas
- TypeScript: Export types separately at end of file using `z.infer<typeof Schema>`
- Lit components: Use `@customElement` decorator

**Barrel Files:**
- Used for widgets: `frontend/src/widgets/index.ts`

## Lit Component Conventions

**Decorators:**
- `@customElement('component-name')` - kebab-case element names
- `@property({ type: Object })` for public properties
- `@state()` for private reactive state

**Lifecycle:**
- Override `willUpdate(changedProperties: PropertyValues)` for data loading
- Override `connectedCallback()` / `disconnectedCallback()` for event listeners
- Use `requestAnimationFrame()` for DOM-dependent operations

## Scala/ZIO Conventions

**Given Instances:**
- Place `given Schema[T]` in companion objects
- Use `DeriveSchema.gen[T]` for automatic derivation

**STM Usage:**
- Use `TMap`, `TRef` for concurrent state in `InMemoryBackend`
- Use `.commit` to execute STM transactions

**Annotations:**
- `@description` for OpenAPI documentation on case class fields

---

*Convention analysis: 2026-01-27*


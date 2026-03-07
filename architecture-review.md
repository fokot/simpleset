# Simpleset Architecture Review

Evaluation of technology choices against the design goals from README.md.

## Design Goals Recap

1. AI-native dashboards (LLM integration, Zod-documented APIs)
2. Built for embedding (web components, hooks, multi-framework)
3. Effortless query & dashboard management (version history)
4. Efficient caching
5. Localization-ready
6. Row-level security & fine-grained access
7. Usage metrics (internal + OTEL)

---

## 1. Zod API Definitions — ✅ Excellent Choice

The `api/` package with Zod schemas as the single source of truth is the strongest architectural decision in the project. Reasons:

- **LLM-friendliness**: Zod schemas are highly parseable by LLMs. An LLM can read the schema, understand valid dashboard structures, and generate conforming JSON. This directly serves the "AI-native" goal better than OpenAPI or JSON Schema would, because Zod is code — LLMs are better at reading/writing code than spec files.
- **Runtime validation**: Zod validates at runtime, not just compile time. This matters for a system that accepts LLM-generated content — you need to validate untrusted structured output.
- **Type inference**: `z.infer<>` gives you TypeScript types for free, eliminating type drift.

**Issue**: The frontend `dashboard-types.ts` duplicates the Zod definitions manually. This will drift. You should generate or import types from the `api/` package. Even a simple build step that runs `tsc` on the api package and copies the inferred types would close this gap.

**Issue**: The backend `model.scala` defines its own models independently. For the backend, since Zod→Scala codegen isn't trivial, a pragmatic approach is to keep the Scala models minimal (as you've done) and validate the JSON blob against Zod schemas at the API boundary (e.g., in a thin Node.js validation proxy, or by generating JSON Schema from Zod and validating in Scala).

## 2. Lit Web Components — ✅ Excellent Choice

Lit is the right call for "built for embedding." Here's why:

- **Native web components**: Lit compiles to standard Custom Elements. They work in React, Vue, Angular, Svelte, or plain HTML with zero adapters. Stencil does this too, but Lit is lighter (~5KB) and closer to the platform.
- **Shadow DOM**: Provides style encapsulation, critical for embedded widgets that must not leak CSS into or absorb CSS from the host page.
- **No virtual DOM overhead**: For a dashboard with many widgets, Lit's direct DOM updates are more efficient than React-based alternatives.
- **Google-backed, stable**: Lit is mature (evolved from Polymer) and has long-term support.

**The alternative (Stencil)** would also work, but adds a compiler layer and is heavier. For your use case — embeddable widgets that need to be framework-agnostic — Lit is the leaner, more appropriate choice.

## 3. ECharts — ✅ Good Choice (with caveats)

ECharts is a solid choice for a "support one best library" strategy:

- **Most feature-complete**: 20+ chart types out of the box (you list them all in `ChartTypeSchema`). Heatmaps, sankey, treemap, candlestick — these are hard to get from Chart.js or Recharts without plugins.
- **~550K weekly npm downloads**, Apache 2.0 license, backed by Apache Foundation.
- **Built-in interactivity**: Tooltips, zoom, drill-down, data views — all built in. This aligns with your `InteractiveConfigSchema`.
- **Good for dashboards specifically**: ECharts was designed for BI dashboards (originated at Baidu for internal analytics). Chart.js is simpler but less capable. D3 is more powerful but requires building everything from scratch.
- **SSR support**: Can render to SVG/Canvas server-side if you later need thumbnail generation or PDF export.

**Caveats**:
- **Bundle size**: ECharts is ~1MB unminified (~300KB gzipped). For an embedded widget, this is significant. Consider using ECharts' tree-shakeable modules (`echarts/core` + only the chart types you need) to cut this down.
- **Opinionated config format**: You've mapped ECharts' config format directly into your Zod schema (`EChartsConfigSchema`). This tightly couples your API to ECharts internals. If you ever wanted to swap charting libraries, the entire API schema would break. Consider an abstraction layer — a simpler Simpleset chart config that gets translated to ECharts options in the frontend.

## 4. Scala 3 + ZIO Backend — ⚠️ Acceptable, With Trade-offs

Choosing Scala 3 + ZIO for familiarity is honest and valid. The implementation is clean. But there are trade-offs to acknowledge:

**Strengths**:
- ZIO's effect system gives you structured concurrency, resource management (`Scope`), and composable error handling — all valuable for a multi-datasource query engine.
- The `DataSourceRegistry` using `TMap` (STM) is elegant for concurrent data source management.
- `PostgresBackend` with Magnum is clean and type-safe.
- ZIO HTTP's endpoint-based API gives you automatic OpenAPI generation.

**Trade-offs**:
- **Contributor barrier**: Scala 3 + ZIO is a niche stack. If you want community contributions or to hire, this narrows the pool significantly. For an open-source Superset alternative, this matters.
- **Zod↔Scala gap**: Your API definitions are in Zod (TypeScript), but the backend is Scala. There's no automated bridge. The backend `model.scala` is a separate, minimal set of types. This is fine for now, but as the API grows (datasource CRUD, query builder, RLS rules), keeping them in sync manually will become painful.
- **JVM cold start**: Less relevant for a long-running server, but worth noting if you ever target serverless deployment.

**Verdict**: For a solo/small-team project where you're productive in Scala, this is fine. If the project grows and you want contributors, consider whether a TypeScript/Node.js backend (sharing Zod schemas directly) or a Go/Rust backend (simpler learning curve) would serve better. The current architecture makes it easy to swap — the `Backend` trait is clean and the API is well-separated.

## 5. Vite — ✅ Excellent Choice

Vite is the standard build tool for modern frontend projects:

- **Rollup under the hood** for production builds — optimized output, tree-shaking, code splitting.
- **Instant HMR dev server** with native ESM — no bundling during development.
- **Zero-config TypeScript**: No plugins needed, just works.
- **`lib` mode** is purpose-built for web component libraries — the build config is ~50 lines.
- **Ecosystem standard**: Widest community adoption, extensive plugin ecosystem, long-term support.

## 6. Preact Signals for Editor State — ✅ Good Choice

The `EditorStore` using `@preact/signals-core` is well-designed:

- Signals are lightweight, fine-grained reactive primitives — ideal for editor state (selection, drag, resize).
- `@lit-labs/preact-signals` integrates them with Lit's rendering cycle.
- The store pattern (singleton with operations) is clean and testable.
- History/undo/redo with snapshot arrays is straightforward and correct.

## 7. Architecture Patterns — Assessment

### What's working well:
- **Clean separation**: `api/` (contract) → `frontend/` (rendering) → `backend/` (data) is the right layering.
- **Backend trait abstraction**: `Backend` trait with `InMemoryBackend` and `PostgresBackend` implementations — textbook clean architecture.
- **DataSource abstraction**: `DataSource` trait + `DataSourceRegistry` allows plugging in new databases cleanly.
- **Dashboard as JSON blob**: Storing the dashboard as opaque JSON in the backend is pragmatic. The backend doesn't need to understand widget layout — it just stores and retrieves.
- **Widget discriminated union**: `WidgetConfigSchema` using Zod's `discriminatedUnion` is the correct pattern for heterogeneous widget types.

### What needs attention:
- **SQL injection risk**: `PostgresDataSource.substituteParams` does string replacement with `escapeSqlString` (single-quote escaping only). This is fragile. Use parameterized queries instead. The `{{paramName}}` template approach is fine for the API, but the backend should convert these to proper JDBC `?` parameters before execution.
- **No query sandboxing**: The system executes arbitrary SQL from dashboard definitions. For row-level security (a stated goal), you'll need a query rewriting layer that injects WHERE clauses, or a query proxy that validates/transforms SQL before execution.
- **CORS wide open**: `allowedOrigin = _ => Some(AccessControlAllowOrigin.All)` is marked FIXME. For embedded use, you'll need configurable allowed origins.
- **No caching layer yet**: "Efficient caching" is a design goal. The `CacheStatsSchema` and `CacheEntrySchema` are defined in Zod, but nothing is implemented. The architecture supports it — you'd add a cache layer in the `DataSource.getData` path.

---

## Summary Scorecard

| Decision | Rating | Notes |
|---|---|---|
| Zod API schemas | ✅ Excellent | Best choice for LLM + validation + types |
| Lit web components | ✅ Excellent | Perfect for embeddable, framework-agnostic widgets |
| ECharts | ✅ Good | Most capable single library; watch bundle size, consider abstraction layer |
| Scala 3 + ZIO | ⚠️ Acceptable | Clean code, but niche; contributor/hiring barrier |
| Vite | ✅ Excellent | Fast HMR dev server, Rollup-based production builds, native TS/ESM support, minimal config |
| Preact Signals | ✅ Good | Right tool for reactive editor state with Lit |
| PostgreSQL storage | ✅ Good | Solid default; JSON blob storage is pragmatic |

## Top 3 Actions

1. **Fix SQL injection**: Replace string substitution with parameterized queries in `PostgresDataSource`. This is a security issue, not just a nice-to-have.
2. **Eliminate type duplication**: Generate `frontend/src/types/dashboard-types.ts` from `api/` Zod schemas. Even a manual `npm run sync-types` script would help.


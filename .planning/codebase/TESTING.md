# Testing Patterns

**Analysis Date:** 2026-01-27

## Test Framework

**Runner:**
- Scala: ZIO Test 2.1.22 with `ZTestFramework`
- Config: `backend/build.sbt` - `testFrameworks += new TestFramework("zio.test.sbt.ZTestFramework")`
- TypeScript: No test framework configured (no Jest, Vitest, or similar detected)

**Assertion Library:**
- ZIO Test: Built-in `assertTrue`, `assertTrue(condition1, condition2, ...)`

**Run Commands:**
```bash
cd backend && sbt test           # Run all Scala tests
cd backend && sbt ~test          # Watch mode (via ~ prefix)
# No frontend tests configured
```

## Test File Organization

**Location:**
- Scala: Separate directory pattern: `backend/src/test/scala/com/simpleset/`
- Tests mirror source structure under `test/` directory

**Naming:**
- Scala: `*Spec.scala` suffix (e.g., `ModelSpec.scala`, `InMemoryBackendSpec.scala`)

**Structure:**
```
backend/
└── src/
    ├── main/scala/com/simpleset/
    │   ├── model.scala
    │   └── dashboard/
    │       └── InMemoryBackend.scala
    └── test/scala/com/simpleset/
        ├── ModelSpec.scala
        └── dashboard/
            └── InMemoryBackendSpec.scala
```

## Test Structure

**Suite Organization:**
```scala
// From `backend/src/test/scala/com/simpleset/ModelSpec.scala`
object ModelSpec extends ZIOSpecDefault {
  def spec = suite("ModelSpec")(
    test("read and parse databindings from dashboard.json") {
      for {
        jsonString <- ZIO.attempt { /* read file */ }
        json <- ZIO.fromEither(jsonString.fromJson[Json])
        charts = findDataBindings(json)
        expected = List(/* expected values */)
      } yield assertTrue(charts == expected)
    }
  )
}
```

**Patterns:**
- Extend `ZIOSpecDefault` for default test environments
- Use `suite("Name")(tests...)` to group related tests
- Use `test("description") { for-comprehension }` for individual tests
- Always return `assertTrue(...)` at end of for-comprehension

## Test Resource Loading

**Pattern for test resources:**
```scala
// From `backend/src/test/scala/com/simpleset/ModelSpec.scala`
val source = Source.fromResource("dashboard.json")
try source.mkString
finally source.close()
```

**Location:**
- Test resources in `backend/src/test/resources/`

## Mocking

**Framework:** ZIO Test built-in capabilities

**Patterns:**
```scala
// From `backend/src/test/scala/com/simpleset/dashboard/InMemoryBackendSpec.scala`
// Create fresh instance per test using factory method
for {
  backend <- InMemoryBackend.make
  // ... test operations
} yield assertTrue(...)
```

**Time Control:**
```scala
// Use TestClock for time-dependent tests
_ <- TestClock.adjust(10.millis)
```

**What to Mock:**
- Create in-memory implementations of traits (`InMemoryBackend` implements `Backend`)
- Use `TestClock` for time-based assertions

**What NOT to Mock:**
- Pure functions and data transformations
- JSON parsing/serialization

## Fixtures and Factories

**Test Data:**
```scala
// Inline test data creation
val dashboard = Json.Obj("title" -> Json.Str("Test Dashboard"))
val dashboard1 = Json.Obj("title" -> Json.Str("Version 1"))
```

**Location:**
- Inline in test files for simple cases
- Resource files (`src/test/resources/`) for complex JSON fixtures

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
cd backend && sbt coverage test coverageReport  # If sbt-scoverage is added
```

## Test Types

**Unit Tests:**
- Focus on single functions/methods (e.g., `findDataBindings`)
- Use in-memory implementations for isolated testing

**Integration Tests:**
- Backend API tests with in-memory storage (`InMemoryBackendSpec`)
- Test full CRUD operations through trait interface

**E2E Tests:**
- Not configured - HTML demo files serve as manual integration tests (`examples/*.html`)

## Common Patterns

**Async Testing:**
```scala
// ZIO for-comprehension handles async naturally
for {
  backend <- InMemoryBackend.make
  _ <- backend.saveDashboard("test", dashboard)
  result <- backend.getDashboard("test")
} yield assertTrue(result.name == "test")
```

**Error Testing:**
```scala
// From `backend/src/test/scala/com/simpleset/dashboard/InMemoryBackendSpec.scala`
for {
  backend <- InMemoryBackend.make
  result <- backend.getDashboard("non-existent").exit
} yield assertTrue(
  result.isFailure,
  result match {
    case Exit.Failure(cause) =>
      cause.failures.headOption.exists(_.isInstanceOf[NoSuchElementException])
    case _ => false
  }
)
```

**Multiple Assertions:**
```scala
} yield assertTrue(
  dashboards.length == 1,
  dashboards.head.name == "test-dashboard",
  dashboards.head.id == 1L
)
```

## Test Files Reference

| File | Purpose |
|------|---------|
| `backend/src/test/scala/com/simpleset/ModelSpec.scala` | JSON parsing, data binding extraction |
| `backend/src/test/scala/com/simpleset/dashboard/InMemoryBackendSpec.scala` | Backend CRUD operations |

---

*Testing analysis: 2026-01-27*


package com.simpleset

import zio.*
import zio.http.*
import zio.http.codec.*
import zio.http.codec.PathCodec.*
import zio.http.endpoint.*
import zio.http.endpoint.openapi.*
import zio.json.ast.Json
import zio.json.DecoderOps
import zio.schema.{DeriveSchema, Schema}
import zio.schema.annotation.description

import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.time.Instant

// Schema definitions for OpenAPI
given Schema[Instant] = Schema.primitive[String].transform(
  str => Instant.parse(str),
  instant => instant.toString
)

// Use a dynamic schema for Json that accepts any JSON structure
given Schema[Json] = Schema.defer(Schema.dynamicValue.transform(
  dv => Json.Null, // This is a placeholder, actual conversion happens via codec
  json => zio.schema.DynamicValue.fromSchemaAndValue(Schema[String], json.toString)
))

given Schema[DashboardVersionList] = DeriveSchema.gen[DashboardVersionList]
given Schema[DashboardVersion] = DeriveSchema.gen[DashboardVersion]

// Request/Response models for OpenAPI - use String for dashboard to avoid schema issues
case class SaveDashboardRequest(
  @description("Name of the dashboard")
  name: String,
  @description("Dashboard configuration as JSON string")
  dashboard: String
)

object SaveDashboardRequest:
  given Schema[SaveDashboardRequest] = DeriveSchema.gen[SaveDashboardRequest]

case class SuccessResponse(
  @description("Status message")
  status: String
)

object SuccessResponse:
  given Schema[SuccessResponse] = DeriveSchema.gen[SuccessResponse]

case class ErrorResponse(
  @description("Error message")
  error: String
)

object ErrorResponse:
  given Schema[ErrorResponse] = DeriveSchema.gen[ErrorResponse]

object Main extends ZIOAppDefault:

  // Initialize backend with sample data
  def initializeBackend(backend: Backend): Task[Unit] =
    for {
      _ <- backend.saveDashboard("Sales Dashboard", Json.Obj("type" -> Json.Str("sales")))
      _ <- backend.saveDashboard("Marketing Analytics", Json.Obj("type" -> Json.Str("marketing")))
      _ <- backend.saveDashboard("User Engagement", Json.Obj("type" -> Json.Str("engagement")))
      _ <- backend.saveDashboard("Financial Overview", Json.Obj("type" -> Json.Str("financial")))
      _ <- backend.saveDashboard("System Performance", Json.Obj("type" -> Json.Str("performance")))
    } yield ()

  // Define endpoints using Endpoint API

  // GET /dashboards - List all dashboards
  val getDashboardsEndpoint =
    Endpoint(RoutePattern.GET / "dashboards")
      .out[List[DashboardVersionList]](Doc.p("List of all dashboards"))
      .outError[ErrorResponse](Status.InternalServerError) ?? Doc.p("Get all dashboards")

  // POST /dashboards - Create or update a dashboard
  val saveDashboardEndpoint =
    Endpoint(RoutePattern.POST / "dashboards")
      .in[SaveDashboardRequest](Doc.p("Dashboard data to save"))
      .out[SuccessResponse](Doc.p("Success response"))
      .outError[ErrorResponse](Status.BadRequest) ?? Doc.p("Create or update a dashboard")

  // GET /dashboards/:name - Get dashboard by name
  val getDashboardByNameEndpoint =
    Endpoint(RoutePattern.GET / "dashboards" / PathCodec.string("name"))
      .out[DashboardVersion](Doc.p("Dashboard details"))
      .outError[ErrorResponse](Status.NotFound) ?? Doc.p("Get dashboard by name")

  // GET /dashboards/id/:id - Get dashboard by ID
  val getDashboardByIdEndpoint =
    Endpoint(RoutePattern.GET / "dashboards" / "id" / PathCodec.long("id"))
      .out[DashboardVersion](Doc.p("Dashboard details"))
      .outError[ErrorResponse](Status.NotFound) ?? Doc.p("Get dashboard by ID")

  // Implement endpoints
  def routes(backend: Backend) =
    val getDashboardsRoute = getDashboardsEndpoint.implementHandler(
      handler {
        backend.getDashboards.mapError(err => ErrorResponse(err.getMessage))
      }
    )

    val saveDashboardRoute = saveDashboardEndpoint.implementHandler(
      handler { (req: SaveDashboardRequest) =>
        (for {
          json <- ZIO.fromEither(req.dashboard.fromJson[Json])
            .mapError(err => new IllegalArgumentException(s"Invalid JSON: $err"))
          _ <- backend.saveDashboard(req.name, json)
        } yield SuccessResponse("success"))
          .mapError(err => ErrorResponse(err.getMessage))
      }
    )

    val getDashboardByNameRoute = getDashboardByNameEndpoint.implementHandler(
      handler { (name: String) =>
        val decodedName = URLDecoder.decode(name, StandardCharsets.UTF_8)
        backend.getDashboard(decodedName)
          .mapError(err => ErrorResponse(err.getMessage))
      }
    )

    val getDashboardByIdRoute = getDashboardByIdEndpoint.implementHandler(
      handler { (id: Long) =>
        backend.getDashboard(id)
          .mapError(err => ErrorResponse(err.getMessage))
      }
    )

    Routes(
      getDashboardsRoute,
      saveDashboardRoute,
      getDashboardByNameRoute,
      getDashboardByIdRoute
    )

  private val port = 8080

  // Main application
  def run =
    for
      _ <- Console.printLine(s"Starting ZIO-HTTP server on port $port...")

      // Create backend instance
      backend <- InMemoryBackend.make

      // Initialize with sample data
      _ <- initializeBackend(backend)

      // Generate OpenAPI documentation
      openAPI = OpenAPIGen.fromEndpoints(
        title = "SimpleSet Dashboard API",
        version = "1.0.0",
        getDashboardsEndpoint,
        saveDashboardEndpoint,
        getDashboardByNameEndpoint,
        getDashboardByIdEndpoint
      )

      // Create Swagger UI routes
      swaggerRoutes = SwaggerUI.routes(path("docs") / "openapi", openAPI)

      // Combine all routes
      allRoutes = routes(backend) ++ swaggerRoutes

      // Create the HTTP app with CORS support
      httpApp = allRoutes @@ Middleware.cors

      _ <- Server.serve(httpApp).provide(Server.default)
    yield ()

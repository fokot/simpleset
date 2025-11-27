package com.simpleset

import com.simpleset.dashboard.{Backend, InMemoryBackend}
import com.simpleset.model.{DashboardVersion, DashboardVersionList}
import zio.*
import zio.http.*
import zio.http.codec.*
import zio.http.codec.PathCodec.*
import zio.http.endpoint.*
import zio.http.endpoint.openapi.*
import zio.http.Header.{AccessControlAllowOrigin, Origin}
import zio.http.Middleware.{CorsConfig, cors}
import zio.http.Server.Config
import zio.json.ast.Json
import zio.json.DecoderOps
import zio.process.Command
import zio.schema.{DeriveSchema, Schema}
import zio.schema.annotation.description

import java.net.{InetSocketAddress, URLDecoder}
import java.nio.charset.StandardCharsets

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

  // GET /api/dashboard-data/:type - Get mock dashboard data by type
  val getDashboardDataEndpoint =
    Endpoint(RoutePattern.GET / "data" / PathCodec.string("dashboard") /  PathCodec.string("chart"))
      .out[Json](Doc.p("Dashboard data as JSON string"))
      .outError[ErrorResponse](Status.NotFound) ?? Doc.p("Get mock dashboard data")

  def getMockChartData(dashboard: String, chart: String): String = {
    // In a real implementation, you would execute the SQL query here
    // For now, we'll just log the SQL and return fake data
    //    request.sql.foreach(sql => println(s"Executing SQL: $sql"))
    """{
      "data": [
        {"month": "Jan", "sales": 4200, "revenue": 12500.50},
        {"month": "Feb", "sales": 5100, "revenue": 15200.75},
        {"month": "Mar", "sales": 4800, "revenue": 14100.25},
        {"month": "Apr", "sales": 6200, "revenue": 18500.00},
        {"month": "May", "sales": 7100, "revenue": 21300.50},
        {"month": "Jun", "sales": 6800, "revenue": 20400.75}
      ]
    }"""
  }

  // Implement endpoints
  def routes(backend: Backend) = {
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

    val getDashboardDataRoute = getDashboardDataEndpoint.implementHandler(
      handler { (name: String, chart: String) =>
        ZIO.fromEither(getMockChartData(name, chart).fromJson[Json])
          .mapError(err => ErrorResponse(s"Invalid JSON: $err"))
      }
    )

    Routes(
      getDashboardsRoute,
      saveDashboardRoute,
      getDashboardByNameRoute,
      getDashboardByIdRoute,
      getDashboardDataRoute
    )
  }

  private val port = 8080

  // Main application
  def run: ZIO[ZIOAppArgs & Scope, Throwable, Unit] =
    for
      _ <- Console.printLine(s"Starting ZIO-HTTP server on port $port...")

      // Create backend instance
      backend <- InMemoryBackend.make

      // Generate OpenAPI documentation
      openAPI = OpenAPIGen.fromEndpoints(
        title = "SimpleSet Dashboard API",
        version = "1.0.0",
        getDashboardsEndpoint,
        saveDashboardEndpoint,
        getDashboardByNameEndpoint,
        getDashboardByIdEndpoint,
        getDashboardDataEndpoint
      )

      // Create Swagger UI routes
      swaggerRoutes = SwaggerUI.routes(path("docs") / "openapi", openAPI)

      // Combine all routes
      allRoutes = routes(backend) ++ swaggerRoutes

      // Create the HTTP app with CORS support - allow all origins
      corsConfig = CorsConfig(
        allowedOrigin = _ => Some(AccessControlAllowOrigin.All)
      )
      // FIXME
      httpApp = allRoutes @@ cors(corsConfig)
//      httpApp = allRoutes @@ Middleware.cors

      serverConfig = Config.default.copy(address = new InetSocketAddress(port))

      process <- Server.serve(httpApp).provide(ZLayer.succeed(serverConfig), Server.live).fork
      result <- Command("../examples/init-data.sh", s"http://localhost:$port").exitCode.delay(2.seconds)
      _ <- ZIO.fail(Exception(s"data init failed")).when(result != ExitCode.success)
      _ <- Console.printLine(s"Open http://localhost:$port/docs/openapi to view the API documentation")
      _ <- process.join
    yield ()

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
import zio.json.ast.Json
import zio.json.{DecoderOps, EncoderOps}
import zio.schema.{DeriveSchema, Schema}
import zio.schema.annotation.description
import zio.schema.codec.{BinaryCodec, DecodeError}

import java.net.URLDecoder
import java.nio.charset.StandardCharsets

// Custom HttpContentCodec for zio.json.ast.Json
given HttpContentCodec[Json] = {
  val jsonSchema = Schema.primitive[String].transform(
    str => str.fromJson[Json].getOrElse(Json.Null),
    json => json.toString
  )

  HttpContentCodec.from(
    MediaType.application.`json` ->
      BinaryCodecWithSchema(
        new BinaryCodec[Json] {
          override def decode(bytes: Chunk[Byte]): Either[DecodeError, Json] = {
            val str = new String(bytes.toArray, StandardCharsets.UTF_8)
            str.fromJson[Json].left.map(err => DecodeError.ReadError(Cause.fail(err), err))
          }

          override def encode(value: Json): Chunk[Byte] = {
            Chunk.fromArray(value.toJson.getBytes(StandardCharsets.UTF_8))
          }

          override def streamDecoder: zio.stream.ZPipeline[Any, DecodeError, Byte, Json] = {
            zio.stream.ZPipeline.mapChunksZIO { (chunk: Chunk[Byte]) =>
              ZIO.fromEither(decode(chunk).map(Chunk.single))
            }
          }

          override def streamEncoder: zio.stream.ZPipeline[Any, Nothing, Json, Byte] = {
            zio.stream.ZPipeline.mapChunks { (chunk: Chunk[Json]) =>
              chunk.flatMap(encode)
            }
          }
        },
        jsonSchema
      )
  )
}

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

  // GET /api/dashboard-data/:type - Get mock dashboard data by type
  val getDashboardDataEndpoint =
    Endpoint(RoutePattern.GET / "api" / "dashboard-data" / PathCodec.string("name"))
      .out[Json](Doc.p("Dashboard data as JSON string"))
      .outError[ErrorResponse](Status.NotFound) ?? Doc.p("Get mock dashboard data")

  // Mock data generator
  def getMockDashboardData(name: String): String = name match {
    case "sample" => """{
      "revenue-metric": {
        "value": 125000,
        "trend": { "value": 12.5, "direction": "up" },
        "target": 150000
      },
      "conversion-metric": {
        "value": 0.034,
        "trend": { "value": 2.1, "direction": "up" }
      },
      "customers-metric": {
        "value": 1247,
        "trend": { "value": 8.3, "direction": "up" }
      },
      "orders-metric": {
        "value": 89,
        "trend": { "value": 5.2, "direction": "down" }
      },
      "sales-chart": {
        "type": "line",
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "datasets": [
          {
            "label": "Sales",
            "data": [65000, 78000, 82000, 95000, 110000, 125000],
            "backgroundColor": "#2196f3",
            "borderColor": "#1976d2"
          },
          {
            "label": "Target",
            "data": [70000, 75000, 80000, 90000, 105000, 120000],
            "backgroundColor": "#4caf50",
            "borderColor": "#388e3c"
          }
        ]
      },
      "top-products": {
        "rows": [
          { "product": "Premium Widget", "sales": 45000, "growth": 0.15 },
          { "product": "Standard Widget", "sales": 32000, "growth": 0.08 },
          { "product": "Basic Widget", "sales": 28000, "growth": -0.02 },
          { "product": "Deluxe Widget", "sales": 20000, "growth": 0.25 },
          { "product": "Mini Widget", "sales": 15000, "growth": 0.12 },
          { "product": "Mega Widget", "sales": 12000, "growth": 0.18 },
          { "product": "Ultra Widget", "sales": 8000, "growth": 0.05 }
        ]
      },
      "recent-orders": {
        "rows": [
          { "orderId": "ORD-001", "customer": "John Smith", "amount": 1250, "status": "Completed", "date": "2024-01-15" },
          { "orderId": "ORD-002", "customer": "Sarah Johnson", "amount": 890, "status": "Processing", "date": "2024-01-15" },
          { "orderId": "ORD-003", "customer": "Mike Wilson", "amount": 2100, "status": "Shipped", "date": "2024-01-14" },
          { "orderId": "ORD-004", "customer": "Emily Davis", "amount": 750, "status": "Completed", "date": "2024-01-14" },
          { "orderId": "ORD-005", "customer": "Chris Brown", "amount": 1800, "status": "Processing", "date": "2024-01-13" },
          { "orderId": "ORD-006", "customer": "Lisa Anderson", "amount": 950, "status": "Shipped", "date": "2024-01-13" },
          { "orderId": "ORD-007", "customer": "David Miller", "amount": 1400, "status": "Completed", "date": "2024-01-12" },
          { "orderId": "ORD-008", "customer": "Jennifer Taylor", "amount": 680, "status": "Processing", "date": "2024-01-12" },
          { "orderId": "ORD-009", "customer": "Robert Garcia", "amount": 2250, "status": "Shipped", "date": "2024-01-11" },
          { "orderId": "ORD-010", "customer": "Amanda White", "amount": 1100, "status": "Completed", "date": "2024-01-11" }
        ]
      }
    }"""
    case _ => "{}"
  }

  def generateChartData(request: ChartDataRequest): ChartDataResponse = {
    // In a real implementation, you would execute the SQL query here
    // For now, we'll just log the SQL and return fake data
    request.sql.foreach(sql => println(s"Executing SQL: $sql"))

    val data = List(
      Map("month" -> "Jan", "sales" -> 4200, "revenue" -> 12500.50),
      Map("month" -> "Feb", "sales" -> 5100, "revenue" -> 15200.75),
      Map("month" -> "Mar", "sales" -> 4800, "revenue" -> 14100.25),
      Map("month" -> "Apr", "sales" -> 6200, "revenue" -> 18500.00),
      Map("month" -> "May", "sales" -> 7100, "revenue" -> 21300.50),
      Map("month" -> "Jun", "sales" -> 6800, "revenue" -> 20400.75)
    )

    val columns = List(
      Map("name" -> "month", "type" -> "string"),
      Map("name" -> "sales", "type" -> "number"),
      Map("name" -> "revenue", "type" -> "number")
    )

    ChartDataResponse(
      data = data,
      columns = columns,
      totalRows = data.length,
      executionTime = 0.125,
      fromCache = false
    )
  }

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

  // JSON encoder for List[String]
  given JsonEncoder[List[String]] = JsonEncoder.list[String]

  // Define the HTTP routes
  val routes = Routes(
    Method.GET / "dashboards" -> handler {
      Response.json(dashboards.toJson)
    }
  )

  // Create the HTTP app with CORS support
  val httpApp = routes @@ Middleware.cors

  // Main application
  def run: ZIO[ZIOAppArgs & Scope, Throwable, Unit] =
    for
      _ <- Console.printLine(s"Starting ZIO-HTTP server on port $port...")
      _ <- Console.printLine(s"Open http://localhost:$port/docs/openapi to view the API documentation")

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
//      httpApp = allRoutes @@ cors(corsConfig)
      httpApp = allRoutes @@ Middleware.cors

      _ <- Server.serve(httpApp).provide(Server.default)
    yield ()

package com.simpleset

import zio.*
import zio.http.*
import zio.json.*

object Main extends ZIOAppDefault:

  // Sample data - list of dashboard names
  val dashboards = List(
    "Sales Dashboard",
    "Marketing Analytics",
    "User Engagement",
    "Financial Overview",
    "System Performance"
  )

  // Chart data request case class
  case class ChartDataRequest(
    sql: Option[String],
    dataSourceId: String
  )

  // Chart data response case class
  case class ChartDataResponse(
    data: List[Map[String, Any]],
    columns: List[Map[String, String]],
    totalRows: Int,
    executionTime: Double,
    fromCache: Boolean
  )

  // JSON encoders/decoders
  given JsonDecoder[ChartDataRequest] = DeriveJsonDecoder.gen[ChartDataRequest]
  given JsonEncoder[List[String]] = JsonEncoder.list[String]

  given JsonEncoder[Map[String, Any]] = new JsonEncoder[Map[String, Any]] {
    def unsafeEncode(m: Map[String, Any], indent: Option[Int], out: zio.json.internal.Write): Unit = {
      out.write('{')
      var first = true
      m.foreach { case (k, v) =>
        if (!first) out.write(',')
        first = false
        JsonEncoder.string.unsafeEncode(k, indent, out)
        out.write(':')
        v match {
          case s: String => JsonEncoder.string.unsafeEncode(s, indent, out)
          case i: Int => JsonEncoder.int.unsafeEncode(i, indent, out)
          case d: Double => JsonEncoder.double.unsafeEncode(d, indent, out)
          case b: Boolean => JsonEncoder.boolean.unsafeEncode(b, indent, out)
          case _ => JsonEncoder.string.unsafeEncode(v.toString, indent, out)
        }
      }
      out.write('}')
    }
  }

  given JsonEncoder[ChartDataResponse] = DeriveJsonEncoder.gen[ChartDataResponse]

  // Fake chart data generator
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

  // Define the HTTP routes
  val routes = Routes(
    Method.GET / "dashboards" -> handler {
      Response.json(dashboards.toJson)
    },
    Method.POST / "data" / string("dashboardId") / string("chartId") -> handler { (dashboardId: String, chartId: String, req: Request) =>
      for {
        bodyStr <- req.body.asString
        _ <- ZIO.logInfo(s"Fetching data for dashboard: $dashboardId, chart: $chartId")
        response <- bodyStr.fromJson[ChartDataRequest] match {
          case Right(chartRequest) =>
            for {
              _ <- ZIO.logInfo(s"SQL: ${chartRequest.sql.getOrElse("No SQL provided")}")
            } yield Response.json(generateChartData(chartRequest).toJson)
          case Left(error) =>
            ZIO.succeed(Response.badRequest(s"Invalid request: $error"))
        }
      } yield response
    }
  )

  // Create the HTTP app with CORS support and error handling
  val httpApp = routes.handleError { error =>
    Response.internalServerError(s"Internal server error: ${error.getMessage}")
  } @@ Middleware.cors

  // Main application
  def run =
    for
      _ <- Console.printLine("Starting ZIO-HTTP server on port 8080...")
      _ <- Server.serve(httpApp).provide(Server.default)
    yield ()

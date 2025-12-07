package com.simpleset

import com.simpleset.dashboard.Backend
import com.simpleset.datasource.DataSourceRegistry
import com.simpleset.model.{DashboardVersion, DashboardVersionList, ErrorResponse, SaveDashboardRequest, SuccessResponse}
import zio.http.codec.PathCodec.path
import zio.{ZIO, ZLayer}
import zio.http.{RoutePattern, Routes, Status, handler}
import zio.http.codec.{Doc, PathCodec}
import zio.http.endpoint.Endpoint
import zio.http.endpoint.openapi.{OpenAPIGen, SwaggerUI}
import zio.json.DecoderOps
import zio.json.ast.Json
import zio.schema.Schema
import zio.schema.codec.json.*

import java.net.URLDecoder
import java.nio.charset.StandardCharsets

object Api {

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
    Endpoint(RoutePattern.GET / "data" / PathCodec.string("dashboard") / PathCodec.long("versionId") / PathCodec.string("chart"))
      .out[Json](Doc.p("Dashboard data as JSON string"))
      .outError[ErrorResponse](Status.NotFound) ?? Doc.p("Get mock dashboard data")

  // Generate OpenAPI documentation
  val openAPI = OpenAPIGen.fromEndpoints(
    title = "SimpleSet Dashboard API",
    version = "1.0.0",
    getDashboardsEndpoint,
    saveDashboardEndpoint,
    getDashboardByNameEndpoint,
    getDashboardByIdEndpoint,
    getDashboardDataEndpoint,
  )

  def layer = ZLayer.fromZIO(
    for {
      backend <- ZIO.service[Backend]
      dataSourceRegistry <- ZIO.service[DataSourceRegistry]
    } yield new Api(backend, dataSourceRegistry)
  )
}

class Api(backend: Backend, dataSourceRegistry: DataSourceRegistry) {

  import Api.*

  val getDashboardsRoute = getDashboardsEndpoint.implementHandler(
    handler {
      backend.getDashboards.mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val saveDashboardRoute = saveDashboardEndpoint.implementHandler(
    handler { (req: SaveDashboardRequest) =>
      (for {
        _ <- backend.saveDashboard(req.name, req.dashboard)
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

  //    def getDataForDashboard(id: Long): RIO[DataSourceRegistry, List[(String, Json)]] = getDataBindings(id).flatMap(
  //      ZIO.foreachPar(_)(chart =>
  //        for {
  //          ds <- DataSourceRegistry.get(chart.dataBinding.dataSourceId)
  //          data <- ds.getData(chart.dataBinding, Map.empty)
  //        } yield (chart.id, data)
  //      )
  //    )


  val getDashboardDataRoute = getDashboardDataEndpoint.implementHandler(
    handler { (id: String, versionId: Long, chartId: String) =>
//      (for {
//        bindings <- backend.getDataBindings(versionId)
//        dataBinding <- ZIO.fromOption(bindings.find(_.id == chartId)).mapBoth(_ => new NoSuchElementException(s"Chart not found: $chartId"), _.dataBinding)
//        ds <- DataSourceRegistry.get(dataBinding.dataSourceId).provideLayer(ZLayer.succeed(dataSourceRegistry))
//        data <- ds.getData(dataBinding, Map.empty)
//      } yield data).mapError(err => ErrorResponse(err.getMessage))
        ZIO.fromEither(getMockChartData(id, chartId).fromJson[Json]).mapError(err => ErrorResponse(err))
    }
  )

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

  def routes = Routes(
    getDashboardsRoute,
    saveDashboardRoute,
    getDashboardByNameRoute,
    getDashboardByIdRoute,
    getDashboardDataRoute
  ) ++ SwaggerUI.routes(path("docs") / "openapi", Api.openAPI)
}

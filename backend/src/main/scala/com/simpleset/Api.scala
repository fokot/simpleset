package com.simpleset

import com.simpleset.dashboard.Backend
import com.simpleset.datasource.{DataSourceBackend, DataSourceCreator, DataSourceRegistry, PostgresConfig, PostgresDataSource}
import com.simpleset.model.*
import zio.http.codec.PathCodec.path
import zio.{Scope, Task, ZIO, ZLayer}
import zio.http.{RoutePattern, Routes, Status, handler}
import zio.http.codec.{Doc, PathCodec}
import zio.http.endpoint.Endpoint
import zio.http.endpoint.openapi.{OpenAPIGen, SwaggerUI}
import zio.json.ast.Json
import zio.schema.Schema
import zio.schema.codec.json.*

import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.time.Instant

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

  // POST /data - Get dashboard data by chart ID with parameters
  val getDashboardDataEndpoint =
    Endpoint(RoutePattern.POST / "data")
      .in[GetDashboardDataRequest](Doc.p("Dashboard data request with parameters"))
      .out[Json](Doc.p("Dashboard data as JSON"))
      .outError[ErrorResponse](Status.NotFound) ?? Doc.p("Get dashboard data for a specific chart")

  // ============================================================================
  // Datasource endpoints
  // ============================================================================

  // GET /api/v1/datasources - List all datasources
  val listDataSourcesEndpoint =
    Endpoint(RoutePattern.GET / "api" / "v1" / "datasources")
      .out[List[DataSourceResponse]](Doc.p("List of all datasources"))
      .outError[ErrorResponse](Status.InternalServerError) ?? Doc.p("List data sources")

  // GET /api/v1/datasources/:id - Get datasource by ID
  val getDataSourceEndpoint =
    Endpoint(RoutePattern.GET / "api" / "v1" / "datasources" / PathCodec.long("id"))
      .out[DataSourceResponse](Doc.p("Datasource details"))
      .outError[ErrorResponse](Status.NotFound) ?? Doc.p("Get data source by ID")

  // POST /api/v1/datasources - Create datasource
  val createDataSourceEndpoint =
    Endpoint(RoutePattern.POST / "api" / "v1" / "datasources")
      .in[CreateDataSourceRequest](Doc.p("Datasource configuration"))
      .out[DataSourceResponse](Doc.p("Created datasource"))
      .outError[ErrorResponse](Status.BadRequest) ?? Doc.p("Create data source")

  // PUT /api/v1/datasources/:id - Update datasource
  val updateDataSourceEndpoint =
    Endpoint(RoutePattern.PUT / "api" / "v1" / "datasources" / PathCodec.long("id"))
      .in[UpdateDataSourceRequest](Doc.p("Updated datasource configuration"))
      .out[DataSourceResponse](Doc.p("Updated datasource"))
      .outError[ErrorResponse](Status.BadRequest) ?? Doc.p("Update data source")

  // DELETE /api/v1/datasources/:id - Delete datasource
  val deleteDataSourceEndpoint =
    Endpoint(RoutePattern.DELETE / "api" / "v1" / "datasources" / PathCodec.long("id"))
      .out[DeletedResponse](Doc.p("Deletion result"))
      .outError[ErrorResponse](Status.NotFound) ?? Doc.p("Delete data source")

  // POST /api/v1/datasources/:id/test - Test saved datasource connection
  val testSavedConnectionEndpoint =
    Endpoint(RoutePattern.POST / "api" / "v1" / "datasources" / PathCodec.long("id") / "test")
      .out[TestConnectionResponse](Doc.p("Connection test result"))
      .outError[ErrorResponse](Status.NotFound) ?? Doc.p("Test saved data source connection")

  // POST /api/v1/datasources/test - Test ad-hoc connection
  val testConnectionEndpoint =
    Endpoint(RoutePattern.POST / "api" / "v1" / "datasources" / "test")
      .in[TestConnectionRequest](Doc.p("Connection configuration to test"))
      .out[TestConnectionResponse](Doc.p("Connection test result"))
      .outError[ErrorResponse](Status.BadRequest) ?? Doc.p("Test data source connection")

  // Generate OpenAPI documentation
  val openAPI = OpenAPIGen.fromEndpoints(
    title = "SimpleSet Dashboard API",
    version = "1.0.0",
    getDashboardsEndpoint,
    saveDashboardEndpoint,
    getDashboardByNameEndpoint,
    getDashboardByIdEndpoint,
    getDashboardDataEndpoint,
    listDataSourcesEndpoint,
    getDataSourceEndpoint,
    createDataSourceEndpoint,
    updateDataSourceEndpoint,
    deleteDataSourceEndpoint,
    testSavedConnectionEndpoint,
    testConnectionEndpoint,
  )

  def layer = ZLayer.fromZIO(
    for {
      backend <- ZIO.service[Backend]
      dataSourceRegistry <- ZIO.service[DataSourceRegistry]
      dataSourceBackend <- ZIO.service[DataSourceBackend]
      scope <- ZIO.service[Scope]
    } yield new Api(backend, dataSourceRegistry, dataSourceBackend, scope)
  )
}

class Api(backend: Backend, dataSourceRegistry: DataSourceRegistry, dataSourceBackend: DataSourceBackend, scope: Scope) {

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
    handler { (req: GetDashboardDataRequest) =>
      (for {
        dashboardVersion <- backend.getDashboard(req.versionId)
        bindings = model.findDataBindings(dashboardVersion.dashboard)
        dataBinding <- ZIO.fromOption(bindings.find(_.id == req.chartId)).mapBoth(_ => new NoSuchElementException(s"Chart not found: ${req.chartId}"), _.dataBinding)
        _ <- ZIO.debug(s"Data binding found: $dataBinding")
        // Convert request parameters (Json) to Map[String, Json]
        params = req.parameters match {
          case Json.Obj(fields) => fields.toMap
          case _ => Map.empty[String, Json]
        }
        _ <- ZIO.debug(s"Query parameters: $params")
        ds <- DataSourceRegistry.get(dataBinding.dataSourceId).provideLayer(ZLayer.succeed(dataSourceRegistry))
        data <- ds.getData(dataBinding, params)
        res = Json.Obj("data" -> data)
      } yield res).mapError(err => ErrorResponse(err.getMessage))
    }
  )

  // ============================================================================
  // Datasource routes
  // ============================================================================

  private def testPostgresConnection(config: DatabaseConnectionConfig): Task[TestConnectionResponse] =
    val jdbcUrl = s"jdbc:postgresql://${config.host}:${config.port}/${config.database}${if config.ssl then "?ssl=true&sslmode=require" else ""}"
    val pgConfig = PostgresConfig(jdbcUrl, config.username, config.password)
    val startTime = System.currentTimeMillis()
    PostgresDataSource.make(pgConfig).provideLayer(ZLayer.succeed(scope)).flatMap { ds =>
      ds.testConnection(ds).map { success =>
        val latency = System.currentTimeMillis() - startTime
        if success then TestConnectionResponse(true, "Connection successful", Some(latency))
        else TestConnectionResponse(false, "Connection test query failed", Some(latency))
      }
    }.catchAll { e =>
      val latency = System.currentTimeMillis() - startTime
      ZIO.succeed(TestConnectionResponse(false, s"Connection failed: ${e.getMessage}", Some(latency)))
    }

  private def registerDataSource(entity: com.simpleset.datasource.DataSourceEntity): Task[Unit] =
    val pgConfig = entity.toPostgresConfig
    PostgresDataSource.make(pgConfig).provideLayer(ZLayer.succeed(scope)).flatMap { ds =>
      dataSourceRegistry.register(entity.id.toString, ds)
    }

  val listDataSourcesRoute = listDataSourcesEndpoint.implementHandler(
    handler {
      dataSourceBackend.getAll
        .map(_.map(_.toResponse))
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val getDataSourceRoute = getDataSourceEndpoint.implementHandler(
    handler { (id: Long) =>
      dataSourceBackend.getById(id)
        .map(_.toResponse)
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val createDataSourceRoute = createDataSourceEndpoint.implementHandler(
    handler { (req: CreateDataSourceRequest) =>
      val now = Instant.now()
      val creator = DataSourceCreator(
        name = req.name,
        description = req.description,
        dsType = req.`type`,
        host = req.config.host,
        port = req.config.port,
        database = req.config.database,
        username = req.config.username,
        password = req.config.password,
        ssl = req.config.ssl,
        status = "disconnected",
        errorMessage = None,
        createdAt = now,
        updatedAt = now
      )
      (for {
        entity <- dataSourceBackend.create(creator)
        _ <- registerDataSource(entity)
      } yield entity.toResponse)
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val updateDataSourceRoute = updateDataSourceEndpoint.implementHandler(
    handler { (id: Long, req: UpdateDataSourceRequest) =>
      (for {
        existing <- dataSourceBackend.getById(id)
        updated = existing.copy(
          name = req.name.getOrElse(existing.name),
          description = req.description.orElse(existing.description),
          host = req.config.map(_.host).getOrElse(existing.host),
          port = req.config.map(_.port).getOrElse(existing.port),
          database = req.config.map(_.database).getOrElse(existing.database),
          username = req.config.map(_.username).getOrElse(existing.username),
          password = req.config.map(_.password).getOrElse(existing.password),
          ssl = req.config.map(_.ssl).getOrElse(existing.ssl),
          updatedAt = Instant.now()
        )
        _ <- dataSourceBackend.updateEntity(updated)
        // Re-register with new config
        _ <- dataSourceRegistry.unregister(id.toString)
        _ <- registerDataSource(updated)
      } yield updated.toResponse)
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val deleteDataSourceRoute = deleteDataSourceEndpoint.implementHandler(
    handler { (id: Long) =>
      (for {
        _ <- dataSourceBackend.remove(id)
        _ <- dataSourceRegistry.unregister(id.toString)
      } yield DeletedResponse(true))
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val testSavedConnectionRoute = testSavedConnectionEndpoint.implementHandler(
    handler { (id: Long) =>
      (for {
        entity <- dataSourceBackend.getById(id)
        config = DatabaseConnectionConfig(
          host = entity.host,
          port = entity.port,
          database = entity.database,
          username = entity.username,
          password = entity.password,
          ssl = entity.ssl
        )
        result <- testPostgresConnection(config)
      } yield result)
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val testConnectionRoute = testConnectionEndpoint.implementHandler(
    handler { (req: TestConnectionRequest) =>
      testPostgresConnection(req.config)
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  def routes = Routes(
    getDashboardsRoute,
    saveDashboardRoute,
    getDashboardByNameRoute,
    getDashboardByIdRoute,
    getDashboardDataRoute,
    listDataSourcesRoute,
    getDataSourceRoute,
    createDataSourceRoute,
    updateDataSourceRoute,
    deleteDataSourceRoute,
    testSavedConnectionRoute,
    testConnectionRoute,
  ) ++ SwaggerUI.routes(path("docs") / "openapi", Api.openAPI)
}

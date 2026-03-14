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
      (for {
        _ <- ZIO.logDebug("GET /dashboards - listing all dashboards")
        result <- backend.getDashboards
        _ <- ZIO.logDebug(s"GET /dashboards - returning ${result.size} dashboard(s)")
      } yield result).mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val saveDashboardRoute = saveDashboardEndpoint.implementHandler(
    handler { (req: SaveDashboardRequest) =>
      (for {
        _ <- ZIO.logDebug(s"POST /dashboards - saving dashboard '${req.name}'")
        _ <- backend.saveDashboard(req.name, req.dashboard)
        _ <- ZIO.logInfo(s"Dashboard '${req.name}' saved successfully")
      } yield SuccessResponse("success"))
        .tapError(err => ZIO.logError(s"POST /dashboards - failed to save dashboard '${req.name}': ${err.getMessage}"))
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val getDashboardByNameRoute = getDashboardByNameEndpoint.implementHandler(
    handler { (name: String) =>
      val decodedName = URLDecoder.decode(name, StandardCharsets.UTF_8)
      (for {
        _ <- ZIO.logDebug(s"GET /dashboards/$decodedName - fetching dashboard by name")
        result <- backend.getDashboard(decodedName)
      } yield result)
        .tapError(err => ZIO.logError(s"GET /dashboards/$decodedName - not found: ${err.getMessage}"))
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val getDashboardByIdRoute = getDashboardByIdEndpoint.implementHandler(
    handler { (id: Long) =>
      (for {
        _ <- ZIO.logDebug(s"GET /dashboards/id/$id - fetching dashboard by ID")
        result <- backend.getDashboard(id)
      } yield result)
        .tapError(err => ZIO.logError(s"GET /dashboards/id/$id - not found: ${err.getMessage}"))
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
        _ <- ZIO.logDebug(s"POST /data - fetching data for chart '${req.chartId}' in dashboard version ${req.versionId}")
        dashboardVersion <- backend.getDashboard(req.versionId)
        bindings = model.findDataBindings(dashboardVersion.dashboard)
        dataBinding <- ZIO.fromOption(bindings.find(_.id == req.chartId)).mapBoth(_ => new NoSuchElementException(s"Chart not found: ${req.chartId}"), _.dataBinding)
        _ <- ZIO.logDebug(s"POST /data - data binding found: dataSourceId=${dataBinding.dataSourceId}")
        // Convert request parameters (Json) to Map[String, Json]
        params = req.parameters match {
          case Json.Obj(fields) => fields.toMap
          case _ => Map.empty[String, Json]
        }
        _ <- ZIO.logDebug(s"POST /data - query parameters: ${params.keys.mkString(", ")}")
        ds <- DataSourceRegistry.get(dataBinding.dataSourceId).provideLayer(ZLayer.succeed(dataSourceRegistry))
        data <- ds.getData(dataBinding, params)
        _ <- ZIO.logDebug(s"POST /data - query executed successfully for chart '${req.chartId}'")
        res = Json.Obj("data" -> data)
      } yield res)
        .tapError(err => ZIO.logError(s"POST /data - failed for chart '${req.chartId}': ${err.getMessage}"))
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  // ============================================================================
  // Datasource routes
  // ============================================================================

  private def resolveEnv(value: String): String =
    if value.startsWith("$") then
      val envName = value.drop(1)
      sys.env.getOrElse(envName, throw new RuntimeException(s"Environment variable '$envName' is not set"))
    else value

  private def testPostgresConnection(config: DatabaseConnectionConfig): Task[TestConnectionResponse] =
    val host = resolveEnv(config.host)
    val database = resolveEnv(config.database)
    val username = resolveEnv(config.username)
    val password = resolveEnv(config.password)
    val jdbcUrl = s"jdbc:postgresql://$host:${config.port}/$database${if config.ssl then "?ssl=true&sslmode=require" else ""}"
    val pgConfig = PostgresConfig(jdbcUrl, username, password)
    val startTime = System.currentTimeMillis()
    ZIO.logDebug(s"Testing connection to ${config.host}:${config.port}/${config.database}") *>
    PostgresDataSource.make(pgConfig).provideLayer(ZLayer.succeed(scope)).flatMap { ds =>
      ds.testConnection(ds).map { success =>
        val latency = System.currentTimeMillis() - startTime
        if success then TestConnectionResponse(true, "Connection successful", Some(latency))
        else TestConnectionResponse(false, "Connection test query failed", Some(latency))
      }
    }.tap(r => ZIO.logDebug(s"Connection test result: success=${r.success}, latency=${r.latency.getOrElse(0)}ms"))
    .catchAll { e =>
      val latency = System.currentTimeMillis() - startTime
      ZIO.logError(s"Connection test failed for ${config.host}:${config.port}/${config.database}: ${e.getMessage}") *>
      ZIO.succeed(TestConnectionResponse(false, s"Connection failed: ${e.getMessage}", Some(latency)))
    }

  private def registerDataSource(entity: com.simpleset.datasource.DataSourceEntity): Task[Unit] =
    val pgConfig = entity.toPostgresConfig
    ZIO.logDebug(s"Registering datasource '${entity.name}' (id=${entity.id}) in registry") *>
    PostgresDataSource.make(pgConfig).provideLayer(ZLayer.succeed(scope)).flatMap { ds =>
      dataSourceRegistry.register(entity.id.toString, ds)
    } <* ZIO.logInfo(s"Datasource '${entity.name}' (id=${entity.id}) registered successfully")

  val listDataSourcesRoute = listDataSourcesEndpoint.implementHandler(
    handler {
      (for {
        _ <- ZIO.logDebug("GET /api/v1/datasources - listing all datasources")
        result <- dataSourceBackend.getAll
        _ <- ZIO.logDebug(s"GET /api/v1/datasources - returning ${result.size} datasource(s)")
      } yield result.map(_.toResponse))
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val getDataSourceRoute = getDataSourceEndpoint.implementHandler(
    handler { (id: Long) =>
      (for {
        _ <- ZIO.logDebug(s"GET /api/v1/datasources/$id - fetching datasource")
        result <- dataSourceBackend.getById(id)
      } yield result.toResponse)
        .tapError(err => ZIO.logError(s"GET /api/v1/datasources/$id - not found: ${err.getMessage}"))
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
        _ <- ZIO.logDebug(s"POST /api/v1/datasources - creating datasource '${req.name}' (type=${req.`type`})")
        entity <- dataSourceBackend.create(creator)
        _ <- registerDataSource(entity)
        _ <- ZIO.logInfo(s"Datasource '${req.name}' created with id=${entity.id}")
      } yield entity.toResponse)
        .tapError(err => ZIO.logError(s"POST /api/v1/datasources - failed to create '${req.name}': ${err.getMessage}"))
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val updateDataSourceRoute = updateDataSourceEndpoint.implementHandler(
    handler { (id: Long, req: UpdateDataSourceRequest) =>
      (for {
        _ <- ZIO.logDebug(s"PUT /api/v1/datasources/$id - updating datasource")
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
        _ <- ZIO.logDebug(s"PUT /api/v1/datasources/$id - re-registering datasource with updated config")
        _ <- dataSourceRegistry.unregister(id.toString)
        _ <- registerDataSource(updated)
        _ <- ZIO.logInfo(s"Datasource '${updated.name}' (id=$id) updated successfully")
      } yield updated.toResponse)
        .tapError(err => ZIO.logError(s"PUT /api/v1/datasources/$id - update failed: ${err.getMessage}"))
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val deleteDataSourceRoute = deleteDataSourceEndpoint.implementHandler(
    handler { (id: Long) =>
      (for {
        _ <- ZIO.logDebug(s"DELETE /api/v1/datasources/$id - deleting datasource")
        _ <- dataSourceBackend.remove(id)
        _ <- dataSourceRegistry.unregister(id.toString)
        _ <- ZIO.logInfo(s"Datasource id=$id deleted successfully")
      } yield DeletedResponse(true))
        .tapError(err => ZIO.logError(s"DELETE /api/v1/datasources/$id - failed: ${err.getMessage}"))
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val testSavedConnectionRoute = testSavedConnectionEndpoint.implementHandler(
    handler { (id: Long) =>
      (for {
        _ <- ZIO.logDebug(s"POST /api/v1/datasources/$id/test - testing saved connection")
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
        .tapError(err => ZIO.logError(s"POST /api/v1/datasources/$id/test - failed: ${err.getMessage}"))
        .mapError(err => ErrorResponse(err.getMessage))
    }
  )

  val testConnectionRoute = testConnectionEndpoint.implementHandler(
    handler { (req: TestConnectionRequest) =>
      ZIO.logDebug(s"POST /api/v1/datasources/test - testing ad-hoc connection to ${req.config.host}:${req.config.port}/${req.config.database}") *>
      testPostgresConnection(req.config)
        .tapError(err => ZIO.logError(s"POST /api/v1/datasources/test - failed: ${err.getMessage}"))
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

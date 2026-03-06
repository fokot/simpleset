package com.simpleset

import com.augustnagro.magnum.magzio.*
import com.simpleset.dashboard.InMemoryBackend
import com.simpleset.datasource.{DataSourceBackend, DataSourceRegistry, PostgresConfig, PostgresDataSource}
import com.zaxxer.hikari.{HikariConfig, HikariDataSource}
import zio.*
import zio.http.*
import zio.http.Header.AccessControlAllowOrigin
import zio.http.Middleware.{CorsConfig, cors}
import zio.http.Server.Config
import zio.process.Command

import java.net.InetSocketAddress
import javax.sql.{DataSource => JdbcDataSource}


object Main extends ZIOAppDefault:

  private val port = 3000
  private val serverConfig = Config.default.copy(address = new InetSocketAddress(port))

  // App database config (used for storing datasource configs, dashboards, etc.)
  private val appDbConfig = PostgresConfig(
    jdbcUrl = "jdbc:postgresql://localhost:5432/postgres",
    username = "postgres",
    password = "postgres"
  )

  // Create a HikariCP datasource for the app's own database
  private def appDataSourceLayer: ZLayer[Scope, Throwable, JdbcDataSource] =
    ZLayer.fromZIO {
      ZIO.acquireRelease(
        ZIO.attempt {
          val hikariConfig = new HikariConfig()
          hikariConfig.setJdbcUrl(appDbConfig.jdbcUrl)
          hikariConfig.setUsername(appDbConfig.username)
          hikariConfig.setPassword(appDbConfig.password)
          hikariConfig.setMaximumPoolSize(10)
          hikariConfig.setMinimumIdle(2)
          hikariConfig.setDriverClassName("org.postgresql.Driver")
          new HikariDataSource(hikariConfig): JdbcDataSource
        }
      )(ds => ZIO.attempt(ds.asInstanceOf[HikariDataSource].close()).orDie)
    }

  // Load persisted datasources into the registry on startup
  private def loadPersistedDataSources: ZIO[DataSourceBackend & DataSourceRegistry & Scope, Throwable, Unit] =
    for {
      dsBackend <- ZIO.service[DataSourceBackend]
      registry <- ZIO.service[DataSourceRegistry]
      entities <- dsBackend.getAll
      _ <- ZIO.foreachDiscard(entities) { entity =>
        val pgConfig = entity.toPostgresConfig
        PostgresDataSource.make(pgConfig).flatMap { ds =>
          registry.register(entity.id.toString, ds)
        }.catchAll { e =>
          ZIO.logWarning(s"Failed to load datasource '${entity.name}' (id=${entity.id}): ${e.getMessage}")
        }
      }
      _ <- ZIO.logInfo(s"Loaded ${entities.size} persisted datasource(s) into registry")
    } yield ()

  // Main application
  def run: ZIO[ZIOAppArgs & Scope, Throwable, Unit] =
    ZIO.scoped(for
      _ <- ZIO.logInfo(s"Starting ZIO-HTTP server on port $port...")

      // Load persisted datasources into registry
      _ <- ZIO.logDebug("Loading persisted datasources into registry...")
      _ <- loadPersistedDataSources

      routes <- ZIO.service[Api]

      // Create the HTTP app with CORS support - allow all origins
      corsConfig = CorsConfig(
        allowedOrigin = _ => Some(AccessControlAllowOrigin.All)
      )
      httpApp = routes.routes @@ cors(corsConfig)

      _ <- ZIO.logDebug("Starting HTTP server...")
      process <- Server.serve(httpApp).fork

      _ <- ZIO.sleep(5.seconds)
      _ <- ZIO.logDebug("Running init-data script...")
      result <- Command("../examples/init-data.sh", s"http://localhost:$port").exitCode
      _ <- ZIO.fail(Exception(s"data init failed")).when(result != ExitCode.success)
      _ <- ZIO.logInfo(s"Server ready. Open http://localhost:$port/docs/openapi to view the API documentation")
      _ <- process.join
    yield ()).provideSome[Scope](
      ZLayer.succeed(serverConfig),
      Server.live,
      DataSourceRegistry.layer,
      Api.layer,
      InMemoryBackend.layer,
      appDataSourceLayer,
      TransactorZIO.layer,
      DataSourceBackend.layerWithSchema,
    )

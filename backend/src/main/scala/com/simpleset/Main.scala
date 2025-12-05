package com.simpleset

import com.simpleset.dashboard.InMemoryBackend
import com.simpleset.datasource.{DataSourceRegistry, PostgresConfig, PostgresDataSource}
import zio.*
import zio.http.*
import zio.http.Header.AccessControlAllowOrigin
import zio.http.Middleware.{CorsConfig, cors}
import zio.http.Server.Config
import zio.process.Command

import java.net.InetSocketAddress


object Main extends ZIOAppDefault:

  private val port = 8080
  private val serverConfig = Config.default.copy(address = new InetSocketAddress(port))

  // Main application
  def run: ZIO[ZIOAppArgs & Scope, Throwable, Unit] =
    ZIO.scoped(for
      _ <- Console.printLine(s"Starting ZIO-HTTP server on port $port...")

      routes <- ZIO.service[SimplesetRoutes]

      // Create the HTTP app with CORS support - allow all origins
      corsConfig = CorsConfig(
        allowedOrigin = _ => Some(AccessControlAllowOrigin.All)
      )
      // FIXME
      httpApp = routes.routes @@ cors(corsConfig)
//      httpApp = allRoutes @@ Middleware.cors

      // for testing
      registry <- ZIO.service[DataSourceRegistry]
      analyticsDb <- PostgresDataSource.make(PostgresConfig(
        "jdbc:postgresql://localhost:5432/postgres",
        "postgres",
        "postgres"
      ))
      _ <- registry.register("analytics-db", analyticsDb)

      process <- Server.serve(httpApp).fork
      result <- Command("../examples/init-data.sh", s"http://localhost:$port").exitCode.delay(5.seconds)
      _ <- ZIO.fail(Exception(s"data init failed")).when(result != ExitCode.success)
      _ <- Console.printLine(s"Open http://localhost:$port/docs/openapi to view the API documentation")
      _ <- process.join
    yield ()).provide(
      ZLayer.succeed(serverConfig),
      Server.live,
      DataSourceRegistry.layer,
      SimplesetRoutes.layer,
      InMemoryBackend.layer,
    )

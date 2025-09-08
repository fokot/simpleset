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
  def run =
    for
      _ <- Console.printLine("Starting ZIO-HTTP server on port 8080...")
      _ <- Server.serve(httpApp).provide(Server.default)
    yield ()

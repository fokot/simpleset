package com.simpleset

import zio.*
import zio.test.*
import zio.http.*
import zio.json.*

object MainSpec extends ZIOSpecDefault:

  def spec = suite("Main")(
    test("GET /dashboards should return list of dashboards as JSON") {
      for
        response <- Main.routes.runZIO(Request.get(URL.decode("/dashboards").toOption.get))
        body <- response.body.asString
        dashboards <- ZIO.fromEither(body.fromJson[List[String]])
      yield {
        val statusOk = response.status == Status.Ok
        val hasContent = dashboards.nonEmpty
        val hasSalesDashboard = dashboards.contains("Sales Dashboard")
        assertTrue(statusOk && hasContent && hasSalesDashboard)
      }
    }
  )

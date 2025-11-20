package com.simpleset.dashboard

import zio.*
import zio.test.*
import zio.json.*
import zio.json.ast.Json

import scala.io.Source

object BackendSpec extends ZIOSpecDefault {

  def spec = suite("BackendSpec")(
    test("read and parse databindings from dashboard.json") {
      for {
        // Read the dashboard.json file from test resources
        jsonString <- ZIO.attempt {
          val source = Source.fromResource("dashboard.json")
          try source.mkString
          finally source.close()
        }

        // Parse the JSON string into Json AST
        json <- ZIO.fromEither(jsonString.fromJson[Json])
          .mapError(err => new RuntimeException(s"Failed to parse JSON: $err"))

        // Extract all data bindings from the JSON
        dataBindings = findDataBindings(json)

        // Expected data bindings
        expected = List(
          DataBinding(
            sql = "SELECT month, actual_revenue, target_revenue, previous_year_revenue FROM monthly_revenue WHERE year = {{year}} AND region IN ({{regions}})",
            dataSourceId = "ds-001"
          ),
          DataBinding(
            sql = "SELECT product_line, market_share_percentage FROM market_share WHERE quarter = {{quarter}}",
            dataSourceId = "ds-001"
          ),
          DataBinding(
            sql = "SELECT region, quarter, SUM(revenue) as total_revenue FROM regional_sales WHERE year = {{year}} GROUP BY region, quarter ORDER BY region",
            dataSourceId = "ds-001"
          ),
          DataBinding(
            sql = "SELECT dimension, current_score, previous_score, industry_avg FROM satisfaction_metrics WHERE period = {{period}}",
            dataSourceId = "ds-002"
          )
        )
      } yield assertTrue(dataBindings == expected)
    }
  )
}

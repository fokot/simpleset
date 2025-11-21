package com.simpleset

import com.simpleset.model.{Chart, DataBinding, findDataBindings}
import zio.*
import zio.test.*
import zio.json.*
import zio.json.ast.Json

import scala.io.Source

object ModelSpec extends ZIOSpecDefault {

  def spec = suite("ModelSpec")(
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

        // Extract all charts from the JSON
        charts = findDataBindings(json)

        // Expected charts with their IDs and data bindings
        expected = List(
          Chart(
            id = "chart-001",
            dataBinding = DataBinding(
              sql = "SELECT month, actual_revenue, target_revenue, previous_year_revenue FROM monthly_revenue WHERE year = {{year}} AND region IN ({{regions}})",
              dataSourceId = "ds-001"
            )
          ),
          Chart(
            id = "chart-002",
            dataBinding = DataBinding(
              sql = "SELECT product_line, market_share_percentage FROM market_share WHERE quarter = {{quarter}}",
              dataSourceId = "ds-001"
            )
          ),
          Chart(
            id = "chart-003",
            dataBinding = DataBinding(
              sql = "SELECT region, quarter, SUM(revenue) as total_revenue FROM regional_sales WHERE year = {{year}} GROUP BY region, quarter ORDER BY region",
              dataSourceId = "ds-001"
            )
          ),
          Chart(
            id = "chart-004",
            dataBinding = DataBinding(
              sql = "SELECT dimension, current_score, previous_score, industry_avg FROM satisfaction_metrics WHERE period = {{period}}",
              dataSourceId = "ds-002"
            )
          )
        )
      } yield assertTrue(charts == expected)
    }
  )
}

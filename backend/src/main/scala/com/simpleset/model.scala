package com.simpleset

import zio.json.{DecoderOps, DeriveJsonDecoder, EncoderOps, JsonDecoder}
import zio.json.ast.Json
import zio.schema.annotation.description
import zio.schema.{DeriveSchema, Schema}
import zio.schema.codec.json.*

import java.time.Instant

object model {

  case class DashboardVersion(id: Long, name: String, dashboard: Json, updatedAt: Instant)

  object DashboardVersion {
    given Schema[DashboardVersion] = DeriveSchema.gen[DashboardVersion]
  }

  case class DashboardVersionList(id: Long, name: String, updatedAt: Instant)
  
  object DashboardVersionList {
    given Schema[DashboardVersionList] = DeriveSchema.gen[DashboardVersionList]
  }

  case class Chart(id: String, dataBinding: DataBinding)

  object Chart {
    given JsonDecoder[Chart] = DeriveJsonDecoder.gen[Chart]
  }

  case class DataBinding(sql: String, dataSourceId: String)

  object DataBinding {
    given JsonDecoder[DataBinding] = DeriveJsonDecoder.gen[DataBinding]
  }

  // Recursively find all data bindings in the dashboard JSON
  // Handles the nested structure where widgets have id at the top level
  // and dataBinding inside config
  def findDataBindings(json: Json): List[Chart] =
    json.foldDown(List.empty)((acc, json) =>
      json match {
        case Json.Obj(fields) =>
          // Check if this is a widget object with id and config.dataBinding
          val idOpt = fields.collectFirst { case ("id", Json.Str(id)) => id }
          val configOpt = fields.collectFirst { case ("config", config) => config }

          (idOpt, configOpt) match {
            case (Some(id), Some(Json.Obj(configFields))) =>
              // Look for dataBinding in config
              configFields.collectFirst { case ("dataBinding", dataBinding) =>
                dataBinding.as[DataBinding].toOption.map(db => Chart(id, db))
              }.flatten match {
                case Some(chart) => acc :+ chart
                case None => acc
              }
            case _ => acc
          }
        case _ => acc
      }
    )


  // Request/Response models for OpenAPI - use String for dashboard to avoid schema issues
  case class SaveDashboardRequest(
                                   @description("Name of the dashboard")
                                   name: String,
                                   @description("Dashboard configuration as JSON string")
                                   dashboard: Json
                                 )

  object SaveDashboardRequest:
    given Schema[SaveDashboardRequest] = DeriveSchema.gen[SaveDashboardRequest]

  case class GetDashboardDataRequest(
                                      @description("Dashboard ID or name")
                                      dashboard: String,
                                      @description("Dashboard version ID")
                                      versionId: Long,
                                      @description("Chart ID")
                                      chartId: String,
                                      @description("Query parameters as JSON object")
                                      parameters: Json
                                    )

  object GetDashboardDataRequest:
    given Schema[GetDashboardDataRequest] = DeriveSchema.gen[GetDashboardDataRequest]

  case class SuccessResponse(
                              @description("Status message")
                              status: String
                            )

  object SuccessResponse:
    given Schema[SuccessResponse] = DeriveSchema.gen[SuccessResponse]

  case class ErrorResponse(
                            @description("Error message")
                            error: String
                          )

  object ErrorResponse:
    given Schema[ErrorResponse] = DeriveSchema.gen[ErrorResponse]
}

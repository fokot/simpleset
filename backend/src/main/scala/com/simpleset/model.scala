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

  // ============================================================================
  // Datasource models
  // ============================================================================

  case class DatabaseConnectionConfig(
    host: String,
    port: Int,
    database: String,
    username: String,
    password: String,
    ssl: Boolean = false
  )

  object DatabaseConnectionConfig:
    given Schema[DatabaseConnectionConfig] = DeriveSchema.gen[DatabaseConnectionConfig]

  case class CreateDataSourceRequest(
    @description("Name of the datasource")
    name: String,
    @description("Description of the datasource")
    description: Option[String] = None,
    @description("Type of the datasource (only 'postgresql' supported)")
    `type`: String = "postgresql",
    @description("Connection configuration")
    config: DatabaseConnectionConfig
  )

  object CreateDataSourceRequest:
    given Schema[CreateDataSourceRequest] = DeriveSchema.gen[CreateDataSourceRequest]

  case class UpdateDataSourceRequest(
    @description("Name of the datasource")
    name: Option[String] = None,
    @description("Description of the datasource")
    description: Option[String] = None,
    @description("Connection configuration")
    config: Option[DatabaseConnectionConfig] = None
  )

  object UpdateDataSourceRequest:
    given Schema[UpdateDataSourceRequest] = DeriveSchema.gen[UpdateDataSourceRequest]

  case class DataSourceResponseConfig(
    host: String,
    port: Int,
    database: String,
    username: String,
    ssl: Boolean,
    password: Option[String] = None
  )

  object DataSourceResponseConfig:
    given Schema[DataSourceResponseConfig] = DeriveSchema.gen[DataSourceResponseConfig]

  case class DataSourceResponse(
    @description("Datasource ID")
    id: Long,
    @description("Name of the datasource")
    name: String,
    @description("Description of the datasource")
    description: Option[String],
    @description("Type of the datasource")
    `type`: String,
    @description("Connection configuration (without password)")
    config: DataSourceResponseConfig,
    @description("Connection status")
    status: String,
    @description("Error message if connection failed")
    errorMessage: Option[String] = None,
    @description("Created at timestamp")
    createdAt: Instant,
    @description("Updated at timestamp")
    updatedAt: Instant
  )

  object DataSourceResponse:
    given Schema[DataSourceResponse] = DeriveSchema.gen[DataSourceResponse]

  case class TestConnectionRequest(
    @description("Type of the datasource")
    `type`: String = "postgresql",
    @description("Connection configuration")
    config: DatabaseConnectionConfig
  )

  object TestConnectionRequest:
    given Schema[TestConnectionRequest] = DeriveSchema.gen[TestConnectionRequest]

  case class TestConnectionResponse(
    @description("Whether the connection was successful")
    success: Boolean,
    @description("Status message")
    message: String,
    @description("Connection latency in milliseconds")
    latency: Option[Long] = None
  )

  object TestConnectionResponse:
    given Schema[TestConnectionResponse] = DeriveSchema.gen[TestConnectionResponse]

  case class DeletedResponse(
    @description("Whether the resource was deleted")
    deleted: Boolean
  )

  object DeletedResponse:
    given Schema[DeletedResponse] = DeriveSchema.gen[DeletedResponse]
}

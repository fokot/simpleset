package com.simpleset

import zio.json.{DeriveJsonDecoder, JsonDecoder, DecoderOps, EncoderOps}
import zio.json.ast.Json
import zio.schema.{DeriveSchema, Schema}

import java.time.Instant

object model {

  // Custom Schema for Json that serializes it as plain JSON string
  given Schema[Json] = Schema.primitive[String].transform(
    str => str.fromJson[Json].getOrElse(Json.Null),
    json => json.toJson
  )

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

  // Recursively find all data bindings in the dashboard JSON slow version can be faster
  def findDataBindings(json: Json): List[Chart] =
    json.foldDown(List.empty)((acc, json) =>
      json match {
        case Json.Obj(fields) if fields.exists(_._1 == "dataBinding") =>
          // Only try to decode if it's an object with a dataBinding field
          acc ++ json.as[Chart].toOption
        case _ =>
          acc
      }
    )
}

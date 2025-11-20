package com.simpleset.dashboard

import zio.*
import zio.json.{DeriveJsonDecoder, JsonDecoder}
import zio.json.ast.Json

import java.time.Instant

case class DashboardVersion(id: Long, name: String, dashboard: Json, updatedAt: Instant)

case class DashboardVersionList(id: Long, name: String, updatedAt: Instant)

case class Chart(id: Long, dataBinding: DataBinding)

given JsonDecoder[DashboardVersionList] = DeriveJsonDecoder.gen[DashboardVersionList]

case class DataBinding(sql: String, dataSourceId: String)

given JsonDecoder[DataBinding] = DeriveJsonDecoder.gen[DataBinding]

// Recursively find all data bindings in the dashboard JSON slow version can be faster
def findDataBindings(json: Json): List[DataBinding] =
  json.foldDown(List.empty)((acc, json) =>
    acc ++ json.as[DataBinding].toOption
  )

trait Backend {

  def getDashboards: Task[List[DashboardVersionList]]

  def saveDashboard(name: String, dashboard: Json): Task[Unit]

  def getDashboard(name: String): Task[DashboardVersion]

  def getDashboard(id: Long): Task[DashboardVersion]

  def getDataBindings(id: Long): Task[List[DataBinding]] = getDashboard(id).map(d => findDataBindings(d.dashboard))

}

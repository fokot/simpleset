package com.simpleset.dashboard

import com.simpleset.datasource.DataSource
import com.simpleset.model.{Chart, DashboardVersion, DashboardVersionList, DataBinding, findDataBindings}
import zio.*
import zio.json.ast.Json

trait Backend {

  def getDashboards: Task[List[DashboardVersionList]]

  def saveDashboard(name: String, dashboard: Json): Task[Unit]

  def getDashboard(name: String): Task[DashboardVersion]

  def getDashboard(id: Long): Task[DashboardVersion]

  def getDataBindings(id: Long): Task[List[Chart]] = getDashboard(id).map(d => findDataBindings(d.dashboard))

  def getDataForDashboard(id: Long): Task[List[(String, Json)]] = getDataBindings(id).flatMap(
      ZIO.foreachPar(_) ( chart =>
        for {
          ds <- DataSource.get(chart.dataBinding.dataSourceId)
          data <- ds.getData(chart.dataBinding, Map.empty)
        } yield (chart.id, data)
      )
  )

  def getDataForChart(id: Long, chartId: String): Task[Json] =
    for {
      bindings <- getDataBindings(id)
      dataBinding <- ZIO.fromOption(bindings.find(_.id == chartId)).mapBoth(_ => new NoSuchElementException(s"Chart not found: $chartId"), _.dataBinding)
      ds <- DataSource.get(dataBinding.dataSourceId)
      data <- ds.getData(dataBinding, Map.empty)
    } yield data
}

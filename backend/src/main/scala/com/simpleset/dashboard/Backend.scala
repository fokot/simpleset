package com.simpleset.dashboard

import com.simpleset.datasource.{DataSource, DataSourceRegistry}
import com.simpleset.model.{Chart, DashboardVersion, DashboardVersionList, DataBinding, findDataBindings}
import zio.*
import zio.json.ast.Json

trait Backend {

  def getDashboards: Task[List[DashboardVersionList]]

  def saveDashboard(name: String, dashboard: Json): Task[Unit]

  def getDashboard(name: String): Task[DashboardVersion]

  def getDashboard(id: Long): Task[DashboardVersion]

  // FIXME add typed api to edit data sources according to zod definitions
}

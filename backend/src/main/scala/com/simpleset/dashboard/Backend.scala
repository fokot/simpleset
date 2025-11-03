package com.simpleset.dashboard

import zio.*
import zio.json.ast.Json

import java.time.Instant

case class DashboardVersion(id: Long, name: String, dashboard: Json, updatedAt: Instant)

case class DashboardVersionList(id: Long, name: String, updatedAt: Instant)

trait Backend {

  def getDashboards: Task[List[DashboardVersionList]]

  def saveDashboard(name: String, dashboard: Json): Task[Unit]

  def getDashboard(name: String): Task[DashboardVersion]

  def getDashboard(id: Long): Task[DashboardVersion]

}

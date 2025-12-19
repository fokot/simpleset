package com.simpleset.dashboard

import com.simpleset.model.{DashboardVersion, DashboardVersionList}
import zio.*
import zio.test.*
import zio.json.*
import zio.json.ast.Json

import java.time.Instant

object InMemoryBackendSpec extends ZIOSpecDefault {

  def spec = suite("InMemoryBackendSpec")(
    test("getDashboards returns empty list initially") {
      for {
        backend <- InMemoryBackend.make
        dashboards <- backend.getDashboards
      } yield assertTrue(dashboards.isEmpty)
    },
    
    test("saveDashboard creates a new dashboard") {
      for {
        backend <- InMemoryBackend.make
        dashboard = Json.Obj("title" -> Json.Str("Test Dashboard"))
        _ <- backend.saveDashboard("test-dashboard", dashboard)
        dashboards <- backend.getDashboards
      } yield assertTrue(
        dashboards.length == 1,
        dashboards.head.name == "test-dashboard",
        dashboards.head.id == 1L
      )
    },
    
    test("saveDashboard updates existing dashboard with same name") {
      for {
        backend <- InMemoryBackend.make
        dashboard1 = Json.Obj("title" -> Json.Str("Version 1"))
        dashboard2 = Json.Obj("title" -> Json.Str("Version 2"))
        _ <- backend.saveDashboard("test-dashboard", dashboard1)
        _ <- backend.saveDashboard("test-dashboard", dashboard2)
        dashboards <- backend.getDashboards
        retrieved <- backend.getDashboard("test-dashboard")
      } yield assertTrue(
        dashboards.length == 1,
        dashboards.head.id == 1L,
        retrieved.dashboard == dashboard2
      )
    },
    
    test("saveDashboard creates multiple dashboards with different names") {
      for {
        backend <- InMemoryBackend.make
        dashboard1 = Json.Obj("title" -> Json.Str("Dashboard 1"))
        dashboard2 = Json.Obj("title" -> Json.Str("Dashboard 2"))
        _ <- backend.saveDashboard("dashboard-1", dashboard1)
        _ <- backend.saveDashboard("dashboard-2", dashboard2)
        dashboards <- backend.getDashboards
      } yield assertTrue(
        dashboards.length == 2,
        dashboards.exists(_.name == "dashboard-1"),
        dashboards.exists(_.name == "dashboard-2")
      )
    },
    
    test("getDashboard by name returns correct dashboard") {
      for {
        backend <- InMemoryBackend.make
        dashboard = Json.Obj("title" -> Json.Str("Test Dashboard"))
        _ <- backend.saveDashboard("test-dashboard", dashboard)
        retrieved <- backend.getDashboard("test-dashboard")
      } yield assertTrue(
        retrieved.name == "test-dashboard",
        retrieved.dashboard == dashboard,
        retrieved.id == 1L
      )
    },
    
    test("getDashboard by name fails for non-existent dashboard") {
      for {
        backend <- InMemoryBackend.make
        result <- backend.getDashboard("non-existent").exit
      } yield assertTrue(
        result.isFailure,
        result match {
          case Exit.Failure(cause) => 
            cause.failures.headOption.exists(_.isInstanceOf[NoSuchElementException])
          case _ => false
        }
      )
    },
    
    test("getDashboard by id returns correct dashboard") {
      for {
        backend <- InMemoryBackend.make
        dashboard = Json.Obj("title" -> Json.Str("Test Dashboard"))
        _ <- backend.saveDashboard("test-dashboard", dashboard)
        retrieved <- backend.getDashboard(1L)
      } yield assertTrue(
        retrieved.name == "test-dashboard",
        retrieved.dashboard == dashboard,
        retrieved.id == 1L
      )
    },
    
    test("getDashboard by id fails for non-existent id") {
      for {
        backend <- InMemoryBackend.make
        result <- backend.getDashboard(999L).exit
      } yield assertTrue(
        result.isFailure,
        result match {
          case Exit.Failure(cause) => 
            cause.failures.headOption.exists(_.isInstanceOf[NoSuchElementException])
          case _ => false
        }
      )
    },
    
    test("getDashboards returns dashboards sorted by updatedAt descending") {
      for {
        backend <- InMemoryBackend.make
        dashboard1 = Json.Obj("title" -> Json.Str("Dashboard 1"))
        dashboard2 = Json.Obj("title" -> Json.Str("Dashboard 2"))
        dashboard3 = Json.Obj("title" -> Json.Str("Dashboard 3"))
        _ <- backend.saveDashboard("dashboard-1", dashboard1)
        _ <- TestClock.adjust(10.millis) // Ensure different timestamps
        _ <- backend.saveDashboard("dashboard-2", dashboard2)
        _ <- TestClock.adjust(10.millis)
        _ <- backend.saveDashboard("dashboard-3", dashboard3)
        dashboards <- backend.getDashboards
      } yield assertTrue(
        dashboards.length == 3,
        dashboards(0).name == "dashboard-3", // Most recent first
        dashboards(1).name == "dashboard-2",
        dashboards(2).name == "dashboard-1"
      )
    },

    test("updating dashboard changes updatedAt timestamp") {
      for {
        backend <- InMemoryBackend.make
        dashboard1 = Json.Obj("title" -> Json.Str("Version 1"))
        dashboard2 = Json.Obj("title" -> Json.Str("Version 2"))
        _ <- backend.saveDashboard("test-dashboard", dashboard1)
        first <- backend.getDashboard("test-dashboard")
        _ <- TestClock.adjust(10.millis)
        _ <- backend.saveDashboard("test-dashboard", dashboard2)
        second <- backend.getDashboard("test-dashboard")
      } yield assertTrue(
        second.updatedAt.isAfter(first.updatedAt)
      )
    }
  )
}


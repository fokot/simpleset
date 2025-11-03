package com.simpleset

import zio.*
import zio.stm.*
import zio.json.ast.Json

import java.time.Instant

// In-memory backend implementation using ZIO STM
class InMemoryBackend(
  storage: TMap[Long, DashboardVersion],
  nameIndex: TMap[String, Long],
  nextIdRef: TRef[Long]
) extends Backend:

  override def getDashboards: Task[List[DashboardVersionList]] =
    (for {
      dashboards <- storage.values
      list = dashboards.map { dv =>
        DashboardVersionList(dv.id, dv.name, dv.updatedAt)
      }.sortBy(_.updatedAt).reverse
    } yield list).commit

  override def saveDashboard(name: String, dashboard: Json): Task[Unit] =
    (for {
      now <- STM.succeed(Instant.now())
      existingIdOpt <- nameIndex.get(name)
      _ <- existingIdOpt match
        case Some(existingId) =>
          // Update existing dashboard
          val updated = DashboardVersion(existingId, name, dashboard, now)
          storage.put(existingId, updated)
        case None =>
          // Create new dashboard
          for {
            id <- nextIdRef.get
            _ <- nextIdRef.update(_ + 1)
            newDashboard = DashboardVersion(id, name, dashboard, now)
            _ <- storage.put(id, newDashboard)
            _ <- nameIndex.put(name, id)
          } yield ()
    } yield ()).commit

  override def getDashboard(name: String): Task[DashboardVersion] =
    (for {
      idOpt <- nameIndex.get(name)
      id <- idOpt match
        case Some(id) => STM.succeed(id)
        case None => STM.fail(new NoSuchElementException(s"Dashboard not found: $name"))
      dashboardOpt <- storage.get(id)
      dashboard <- dashboardOpt match
        case Some(dv) => STM.succeed(dv)
        case None => STM.fail(new NoSuchElementException(s"Dashboard not found: $name"))
    } yield dashboard).commit

  override def getDashboard(id: Long): Task[DashboardVersion] =
    (for {
      dashboardOpt <- storage.get(id)
      dashboard <- dashboardOpt match
        case Some(dv) => STM.succeed(dv)
        case None => STM.fail(new NoSuchElementException(s"Dashboard not found with id: $id"))
    } yield dashboard).commit

object InMemoryBackend:
  def make: UIO[InMemoryBackend] =
    (for {
      storage <- TMap.empty[Long, DashboardVersion]
      nameIndex <- TMap.empty[String, Long]
      nextIdRef <- TRef.make(1L)
    } yield new InMemoryBackend(storage, nameIndex, nextIdRef)).commit

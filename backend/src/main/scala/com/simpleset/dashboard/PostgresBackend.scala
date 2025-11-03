package com.simpleset.dashboard

import com.augustnagro.magnum.magzio.*
import com.augustnagro.magnum.*
import zio.*
import zio.json.*
import zio.json.ast.Json

import java.time.Instant
import javax.sql.DataSource

// Entity class representing the dashboard table in PostgreSQL
@Table(PostgresDbType, SqlNameMapper.CamelToSnakeCase)
case class DashboardEntity(
  @Id id: Long,
  name: String,
  dashboard: String, // JSON stored as text
  updatedAt: Instant
) derives DbCodec:
  def toDomain: DashboardVersion =
    // Parse JSON string back to Json AST
    val jsonAst = dashboard.fromJson[Json].getOrElse(Json.Null)
    DashboardVersion(id, name, jsonAst, updatedAt)

object DashboardEntity:
  val table = TableInfo[DashboardCreator, DashboardEntity, Long]
  
  def fromDomain(id: Long, name: String, dashboard: Json, updatedAt: Instant): DashboardEntity =
    DashboardEntity(id, name, dashboard.toJson, updatedAt)

// Entity creator for inserting new dashboards (without auto-generated id)
case class DashboardCreator(
  name: String,
  dashboard: String,
  updatedAt: Instant
) derives DbCodec

object DashboardCreator:
  def fromDomain(name: String, dashboard: Json, updatedAt: Instant): DashboardCreator =
    DashboardCreator(name, dashboard.toJson, updatedAt)

// PostgreSQL backend implementation using Magnum and ZIO
class PostgresBackend(xa: TransactorZIO)
  extends Repo[DashboardCreator, DashboardEntity, Long]
  with Backend:

  override def getDashboards: Task[List[DashboardVersionList]] =
    xa.transact {
      val dashboards = findAll
      dashboards.map { entity =>
        DashboardVersionList(entity.id, entity.name, entity.updatedAt)
      }.sortBy(_.updatedAt.toEpochMilli).reverse.toList
    }.mapError(e => new RuntimeException(s"Failed to get dashboards: ${e.getMessage}", e))

  override def saveDashboard(name: String, dashboard: Json): Task[Unit] =
    xa.transact {
      val now = Instant.now()
      
      // Check if dashboard with this name already exists
      val spec = Spec[DashboardEntity]
        .where(sql"${DashboardEntity.table.name} = $name")
      
      val existingOpt = findAll(spec).headOption
      
      existingOpt match
        case Some(existing) =>
          // Update existing dashboard
          val updated = DashboardEntity.fromDomain(existing.id, name, dashboard, now)
          update(updated)
          
        case None =>
          // Create new dashboard
          val creator = DashboardCreator.fromDomain(name, dashboard, now)
          insertReturning(creator)
          ()
    }.mapError(e => new RuntimeException(s"Failed to save dashboard '$name': ${e.getMessage}", e))

  override def getDashboard(name: String): Task[DashboardVersion] =
    xa.transact {
      val spec = Spec[DashboardEntity]
        .where(sql"${DashboardEntity.table.name} = $name")
      
      findAll(spec).headOption match
        case Some(entity) => entity.toDomain
        case None => throw new NoSuchElementException(s"Dashboard not found: $name")
    }.mapError {
      case e: NoSuchElementException => e
      case e => new RuntimeException(s"Failed to get dashboard '$name': ${e.getMessage}", e)
    }

  override def getDashboard(id: Long): Task[DashboardVersion] =
    xa.transact {
      findById(id) match
        case Some(entity) => entity.toDomain
        case None => throw new NoSuchElementException(s"Dashboard not found with id: $id")
    }.mapError {
      case e: NoSuchElementException => e
      case e => new RuntimeException(s"Failed to get dashboard with id $id: ${e.getMessage}", e)
    }

object PostgresBackend:
  
  /**
   * Creates the database schema for dashboards.
   * This should be called once during application initialization.
   */
  def createSchema(xa: TransactorZIO): Task[Unit] =
    xa.transact {
      val createTableSql = sql"""
        CREATE TABLE IF NOT EXISTS ${DashboardEntity.table} (
          ${DashboardEntity.table.id} BIGSERIAL PRIMARY KEY,
          ${DashboardEntity.table.name} VARCHAR(255) NOT NULL UNIQUE,
          ${DashboardEntity.table.dashboard} TEXT NOT NULL,
          ${DashboardEntity.table.updatedAt} TIMESTAMP NOT NULL
        )
      """
      
      createTableSql.update.run()
      ()
    }.mapError(e => new RuntimeException(s"Failed to create schema: ${e.getMessage}", e))

  /**
   * Creates a PostgresBackend instance with the given Transactor.
   * The schema must be created separately using createSchema.
   */
  def make(xa: TransactorZIO): UIO[PostgresBackend] =
    ZIO.succeed(new PostgresBackend(xa))

  /**
   * Creates a ZLayer that provides a PostgresBackend.
   * Requires a Transactor to be provided.
   */
  val layer: URLayer[TransactorZIO, PostgresBackend] =
    ZLayer.fromFunction((xa: TransactorZIO) => new PostgresBackend(xa))

  /**
   * Creates a Transactor from a DataSource.
   * This is a convenience method for setting up the database connection.
   */
  def transactorLayer(dataSource: DataSource): ULayer[Transactor] =
    ZLayer.succeed(Transactor(dataSource))

  /**
   * Creates a complete ZLayer that provides both schema initialization and PostgresBackend.
   * This will create the schema if it doesn't exist and then provide the backend.
   */
  def layerWithSchema: ZLayer[TransactorZIO, Throwable, PostgresBackend] =
    ZLayer.scoped {
      for {
        xa <- ZIO.service[TransactorZIO]
        _ <- createSchema(xa)
        backend <- make(xa)
      } yield backend
    }


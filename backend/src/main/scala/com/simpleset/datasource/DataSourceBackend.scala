package com.simpleset.datasource

import com.augustnagro.magnum.magzio.*
import com.augustnagro.magnum.*
import com.simpleset.model.{DataSourceResponse, DataSourceResponseConfig, DatabaseConnectionConfig}
import zio.*

import java.time.Instant

// Entity class representing the data_source table in PostgreSQL
@Table(PostgresDbType, SqlNameMapper.CamelToSnakeCase)
case class DataSourceEntity(
  @Id id: Long,
  name: String,
  description: Option[String],
  dsType: String,
  host: String,
  port: Int,
  database: String,
  username: String,
  password: String,
  ssl: Boolean,
  status: String,
  errorMessage: Option[String],
  createdAt: Instant,
  updatedAt: Instant
) derives DbCodec:
  def toResponse: DataSourceResponse =
    DataSourceResponse(
      id = id,
      name = name,
      description = description,
      `type` = dsType,
      config = DataSourceResponseConfig(
        host = host,
        port = port,
        database = database,
        username = username,
        ssl = ssl
      ),
      status = status,
      errorMessage = errorMessage,
      createdAt = createdAt,
      updatedAt = updatedAt
    )

  def toPostgresConfig: PostgresConfig =
    PostgresConfig(
      jdbcUrl = s"jdbc:postgresql://$host:$port/$database${if ssl then "?ssl=true&sslmode=require" else ""}",
      username = username,
      password = password
    )

object DataSourceEntity:
  val table = TableInfo[DataSourceCreator, DataSourceEntity, Long]

case class DataSourceCreator(
  name: String,
  description: Option[String],
  dsType: String,
  host: String,
  port: Int,
  database: String,
  username: String,
  password: String,
  ssl: Boolean,
  status: String,
  errorMessage: Option[String],
  createdAt: Instant,
  updatedAt: Instant
) derives DbCodec

class DataSourceBackend(xa: TransactorZIO)
  extends Repo[DataSourceCreator, DataSourceEntity, Long]:

  def getAll: Task[List[DataSourceEntity]] =
    xa.transact {
      findAll.toList
    }.mapError(e => new RuntimeException(s"Failed to list datasources: ${e.getMessage}", e))

  def getById(id: Long): Task[DataSourceEntity] =
    xa.transact {
      findById(id) match
        case Some(entity) => entity
        case None => throw new NoSuchElementException(s"Datasource not found with id: $id")
    }.mapError {
      case e: NoSuchElementException => e
      case e => new RuntimeException(s"Failed to get datasource $id: ${e.getMessage}", e)
    }

  def create(creator: DataSourceCreator): Task[DataSourceEntity] =
    xa.transact {
      insertReturning(creator)
    }.mapError(e => new RuntimeException(s"Failed to create datasource: ${e.getMessage}", e))

  def updateEntity(entity: DataSourceEntity): Task[Unit] =
    xa.transact {
      update(entity)
    }.mapError(e => new RuntimeException(s"Failed to update datasource: ${e.getMessage}", e))

  def remove(id: Long): Task[Unit] =
    xa.transact {
      val spec = Spec[DataSourceEntity]
        .where(sql"${DataSourceEntity.table.id} = $id")
      findAll(spec).headOption match
        case Some(_) =>
          delete(findById(id).get)
        case None =>
          throw new NoSuchElementException(s"Datasource not found with id: $id")
    }.mapError {
      case e: NoSuchElementException => e
      case e => new RuntimeException(s"Failed to delete datasource $id: ${e.getMessage}", e)
    }

object DataSourceBackend:

  def createSchema(xa: TransactorZIO): Task[Unit] =
    xa.transact {
      val createTableSql = sql"""
        CREATE TABLE IF NOT EXISTS data_source_entity (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          ds_type VARCHAR(50) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port INTEGER NOT NULL,
          database VARCHAR(255) NOT NULL,
          username VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          ssl BOOLEAN NOT NULL DEFAULT FALSE,
          status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
          error_message TEXT,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      """
      createTableSql.update.run()
      ()
    }.mapError(e => new RuntimeException(s"Failed to create datasource schema: ${e.getMessage}", e))

  def make(xa: TransactorZIO): UIO[DataSourceBackend] =
    ZIO.succeed(new DataSourceBackend(xa))

  val layer: URLayer[TransactorZIO, DataSourceBackend] =
    ZLayer.fromFunction((xa: TransactorZIO) => new DataSourceBackend(xa))

  def layerWithSchema: ZLayer[TransactorZIO, Throwable, DataSourceBackend] =
    ZLayer.scoped {
      for {
        xa <- ZIO.service[TransactorZIO]
        _ <- createSchema(xa)
        backend <- make(xa)
      } yield backend
    }


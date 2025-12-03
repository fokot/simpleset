package com.simpleset.datasource

import com.augustnagro.magnum.magzio.*
import com.augustnagro.magnum.*
import com.simpleset.model.DataBinding
import com.zaxxer.hikari.{HikariConfig, HikariDataSource}
import zio.*
import zio.json.*
import zio.json.ast.Json

import java.sql.{Connection, ResultSet, ResultSetMetaData, Types}
import javax.sql.{DataSource => JdbcDataSource}

/**
 * PostgreSQL-specific configuration for database connections.
 *
 * @param jdbcUrl      JDBC URL for PostgreSQL (e.g., "jdbc:postgresql://localhost:5432/mydb")
 * @param username     Database username
 * @param password     Database password
 * @param maxPoolSize  Maximum number of connections in the pool (default: 10)
 * @param minIdle      Minimum number of idle connections (default: 2)
 * @param connectionTimeout Connection timeout in milliseconds (default: 30000)
 * @param idleTimeout  Idle timeout in milliseconds (default: 600000)
 * @param maxLifetime  Maximum lifetime of a connection in milliseconds (default: 1800000)
 */
case class PostgresConfig(
  jdbcUrl: String,
  username: String,
  password: String,
  maxPoolSize: Int = 10,
  minIdle: Int = 2,
  connectionTimeout: Long = 30000L,
  idleTimeout: Long = 600000L,
  maxLifetime: Long = 1800000L
)

object PostgresConfig:
  given JsonDecoder[PostgresConfig] = DeriveJsonDecoder.gen[PostgresConfig]
  given JsonEncoder[PostgresConfig] = DeriveJsonEncoder.gen[PostgresConfig]

/**
 * PostgreSQL implementation of the DataSource trait.
 * 
 * Provides PostgreSQL-specific functionality for executing SQL queries
 * and returning results as JSON. Uses HikariCP for connection pooling
 * and Magnum ZIO for transactional database operations.
 */
class PostgresDataSource(
  xa: TransactorZIO,
  hikariDataSource: HikariDataSource
) extends DataSource:

  /**
   * Tests the database connection by executing a simple query.
   */
  override def testConnection(ds: PostgresDataSource): Task[Boolean] =
    val testBinding = DataBinding(sql = "SELECT 1 AS test", dataSourceId = "test")
    ds.getData(testBinding, Map.empty)
      .map(_ => true)
      .catchAll(_ => ZIO.succeed(false))

  /**
   * Executes the SQL query from the DataBinding and returns results as JSON.
   * 
   * The SQL query can contain parameter placeholders in the format {{paramName}}.
   * These will be replaced with values from the params map.
   * 
   * @param dataBinding Contains the SQL query to execute
   * @param params      Map of parameter names to JSON values for query substitution
   * @return Task containing JSON array of result rows
   */
  override def getData(dataBinding: DataBinding, params: Map[String, Json]): Task[Json] =
    val processedSql = substituteParams(dataBinding.sql, params)
    
    xa.transact {
      executeQuery(processedSql)
    }.mapError(e => new RuntimeException(s"Failed to execute query: ${e.getMessage}", e))

  /**
   * // FIXME neist po parametroch ale po vsetkych vyskytoch premenntych v slq
   * Substitutes parameter placeholders in SQL with actual values.
   * Placeholders are in the format {{paramName}}.
   */
  private def substituteParams(sql: String, params: Map[String, Json]): String =
    params.foldLeft(sql) { case (currentSql, (key, value)) =>
      val placeholder = s"{{$key}}"
      val replacement = jsonToSqlValue(value)
      currentSql.replace(placeholder, replacement)
    }

  /**
   * Converts a JSON value to a SQL-safe string representation.
   */
  private def jsonToSqlValue(json: Json): String = json match
    case Json.Str(s)  => s"'${escapeSqlString(s)}'"
    case Json.Num(n)  => n.toString
    case Json.Bool(b) => if b then "TRUE" else "FALSE"
    case Json.Null    => "NULL"
    case Json.Arr(arr) => arr.map(jsonToSqlValue).mkString("(", ", ", ")")
    case Json.Obj(_)  => s"'${escapeSqlString(json.toJson)}'"

  /**
   * Escapes single quotes in SQL strings to prevent SQL injection.
   */
  private def escapeSqlString(s: String): String =
    s.replace("'", "''")

  /**
   * Executes a SQL query and converts the result set to JSON.
   * This method runs within a Magnum transaction context.
   */
  private def executeQuery(sqlQuery: String)(using con: DbCon): Json =
    val stmt = con.connection.prepareStatement(sqlQuery)
    try
      val rs = stmt.executeQuery()
      try
        resultSetToJson(rs)
      finally
        rs.close()
    finally
      stmt.close()

  /**
   * Converts a JDBC ResultSet to a JSON array of objects.
   * Each row becomes a JSON object with column names as keys.
   */
  private def resultSetToJson(rs: ResultSet): Json =
    val metaData = rs.getMetaData
    val columnCount = metaData.getColumnCount
    val columnNames = (1 to columnCount).map(metaData.getColumnLabel)
    
    val rows = scala.collection.mutable.ArrayBuffer[Json]()
    
    while rs.next() do
      val fields = columnNames.zipWithIndex.map { case (name, idx) =>
        val columnIndex = idx + 1
        val value = getColumnAsJson(rs, metaData, columnIndex)
        (name, value)
      }
      rows += Json.Obj(fields*)
    
    Json.Arr(rows.toSeq*)

  /**
   * Extracts a column value from the ResultSet and converts it to JSON.
   * Handles PostgreSQL-specific types appropriately.
   */
  private def getColumnAsJson(rs: ResultSet, metaData: ResultSetMetaData, columnIndex: Int): Json =
    if rs.getObject(columnIndex) == null then
      Json.Null
    else
      metaData.getColumnType(columnIndex) match
        case Types.INTEGER | Types.SMALLINT | Types.TINYINT =>
          Json.Num(rs.getInt(columnIndex))
        case Types.BIGINT =>
          Json.Num(rs.getLong(columnIndex))
        case Types.FLOAT | Types.REAL =>
          Json.Num(rs.getFloat(columnIndex))
        case Types.DOUBLE =>
          Json.Num(rs.getDouble(columnIndex))
        case Types.DECIMAL | Types.NUMERIC =>
          val bd = rs.getBigDecimal(columnIndex)
          Json.Num(java.math.BigDecimal(bd.toString))
        case Types.BOOLEAN | Types.BIT =>
          Json.Bool(rs.getBoolean(columnIndex))
        case Types.DATE =>
          Json.Str(rs.getDate(columnIndex).toString)
        case Types.TIME | Types.TIME_WITH_TIMEZONE =>
          Json.Str(rs.getTime(columnIndex).toString)
        case Types.TIMESTAMP | Types.TIMESTAMP_WITH_TIMEZONE =>
          Json.Str(rs.getTimestamp(columnIndex).toString)
        case Types.ARRAY =>
          val array = rs.getArray(columnIndex)
          if array != null then
            val elements = array.getArray.asInstanceOf[Array[?]]
            Json.Arr(elements.map(e => if e == null then Json.Null else Json.Str(e.toString)).toSeq*)
          else Json.Null
        case Types.OTHER =>
          // Handle PostgreSQL JSON/JSONB types
          val str = rs.getString(columnIndex)
          str.fromJson[Json].getOrElse(Json.Str(str))
        case _ =>
          Json.Str(rs.getString(columnIndex))

  /**
   * Closes the underlying HikariCP connection pool.
   * Should be called when the data source is no longer needed.
   */
  def close(): Task[Unit] =
    ZIO.attempt(hikariDataSource.close())


object PostgresDataSource:

  /**
   * Creates a HikariCP DataSource from PostgresConfig.
   */
  def createHikariDataSource(config: PostgresConfig): HikariDataSource =
    val hikariConfig = new HikariConfig()
    hikariConfig.setJdbcUrl(config.jdbcUrl)
    hikariConfig.setUsername(config.username)
    hikariConfig.setPassword(config.password)
    hikariConfig.setMaximumPoolSize(config.maxPoolSize)
    hikariConfig.setMinimumIdle(config.minIdle)
    hikariConfig.setConnectionTimeout(config.connectionTimeout)
    hikariConfig.setIdleTimeout(config.idleTimeout)
    hikariConfig.setMaxLifetime(config.maxLifetime)

    // PostgreSQL-specific settings
    hikariConfig.setDriverClassName("org.postgresql.Driver")
    hikariConfig.addDataSourceProperty("cachePrepStmts", "true")
    hikariConfig.addDataSourceProperty("prepStmtCacheSize", "250")
    hikariConfig.addDataSourceProperty("prepStmtCacheSqlLimit", "2048")
    hikariConfig.addDataSourceProperty("useServerPrepStmts", "true")

    new HikariDataSource(hikariConfig)

  /**
   * Creates a PostgresDataSource from configuration.
   * The returned resource is scoped and will automatically close the connection pool.
   */
  def make(config: PostgresConfig): ZIO[Scope, Throwable, PostgresDataSource] =
    for
      hikariDs <- ZIO.acquireRelease(
        ZIO.attempt(createHikariDataSource(config))
      )(ds => ZIO.attempt(ds.close()).orDie)
      transactor <- ZIO.service[TransactorZIO].provideLayer(
        ZLayer.succeed(hikariDs: JdbcDataSource) >>> TransactorZIO.layer
      )
    yield new PostgresDataSource(transactor, hikariDs)

  /**
   * Creates a ZLayer that provides a PostgresDataSource.
   * Requires PostgresConfig to be provided.
   */
  val layer: ZLayer[PostgresConfig & Scope, Throwable, PostgresDataSource] =
    ZLayer.fromZIO {
      for
        config <- ZIO.service[PostgresConfig]
        ds <- make(config)
      yield ds
    }

  /**
   * Creates a ZLayer from a specific configuration.
   */
  def layerFromConfig(config: PostgresConfig): ZLayer[Scope, Throwable, PostgresDataSource] =
    ZLayer.scoped(make(config))

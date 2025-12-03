package com.simpleset.datasource

import com.simpleset.model.DataBinding
import zio.Task
import zio.json.ast.Json

trait DataSource {

  def testConnection(ds: PostgresDataSource): Task[Boolean]

  def getData(dataBinding: DataBinding, params: Map[String, Json]): Task[Json]

}
package com.simpleset.datasource

import com.simpleset.model.DataBinding
import zio.Task
import zio.json.ast.Json

trait DataSource {

  def getData(dataBinding: DataBinding, params: Map[String, Any]): Task[Json]

}

object DataSource {
  
  def get(id: String): Task[DataSource] = ???
}

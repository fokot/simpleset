package com.simpleset.datasource

import zio.stm.{STM, TMap}
import zio.{RIO, Task, ZIO, ZLayer}

class DataSourceRegistry(dataSources: TMap[String, DataSource]) {

  def register(id: String, dataSource: DataSource): Task[Unit] =
    STM.atomically {
      dataSources.put(id, dataSource)
    }

  def get(id: String): Task[DataSource] =
    STM.atomically {
      dataSources.get(id)
    }.someOrFail(new NoSuchElementException(s"Data source not found: $id"))
}

object DataSourceRegistry {

  def get(id: String): RIO[DataSourceRegistry, DataSource] = ZIO.serviceWithZIO[DataSourceRegistry](_.get(id))

  def layer: ZLayer[Any, Nothing, DataSourceRegistry] =
    ZLayer.fromZIO {
      for {
        dataSources <- TMap.empty[String, DataSource].commit
      } yield new DataSourceRegistry(dataSources)
    }
}

package com.simpleset.datasource

import zio.stm.{STM, TMap}
import zio.{RIO, Task, ZIO, ZLayer}

class DataSourceRegistry(dataSources: TMap[String, DataSource]) {

  def register(id: String, dataSource: DataSource): Task[Unit] =
    ZIO.logDebug(s"Registering datasource id=$id in registry") *>
    STM.atomically {
      dataSources.put(id, dataSource)
    }

  def get(id: String): Task[DataSource] =
    ZIO.logDebug(s"Looking up datasource id=$id in registry") *>
    STM.atomically {
      dataSources.get(id)
    }.someOrFail(new NoSuchElementException(s"Data source not found: $id"))
      .tapError(_ => ZIO.logError(s"Datasource id=$id not found in registry"))

  def unregister(id: String): Task[Unit] =
    ZIO.logDebug(s"Unregistering datasource id=$id from registry") *>
    STM.atomically {
      dataSources.delete(id)
    }

  def getAll: Task[Map[String, DataSource]] =
    STM.atomically {
      dataSources.toMap
    }
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

package com

import zio.{Cause, Chunk, ZIO}
import zio.http.MediaType
import zio.http.codec.{BinaryCodecWithSchema, HttpContentCodec}
import zio.json.*
import zio.json.ast.Json
import zio.schema.Schema
import zio.schema.codec.{BinaryCodec, DecodeError}

import java.nio.charset.StandardCharsets

package object simpleset {

  // Custom HttpContentCodec for zio.json.ast.Json
  given HttpContentCodec[Json] = {
    val jsonSchema = Schema.primitive[String].transform(
      str => str.fromJson[Json].getOrElse(Json.Null),
      json => json.toString
    )

    HttpContentCodec.from(
      MediaType.application.`json` ->
        BinaryCodecWithSchema(
          new BinaryCodec[Json] {
            override def decode(bytes: Chunk[Byte]): Either[DecodeError, Json] = {
              val str = new String(bytes.toArray, StandardCharsets.UTF_8)
              str.fromJson[Json].left.map(err => DecodeError.ReadError(Cause.fail(err), err))
            }

            override def encode(value: Json): Chunk[Byte] = {
              Chunk.fromArray(value.toJson.getBytes(StandardCharsets.UTF_8))
            }

            override def streamDecoder: zio.stream.ZPipeline[Any, DecodeError, Byte, Json] = {
              zio.stream.ZPipeline.mapChunksZIO { (chunk: Chunk[Byte]) =>
                ZIO.fromEither(decode(chunk).map(Chunk.single))
              }
            }

            override def streamEncoder: zio.stream.ZPipeline[Any, Nothing, Json, Byte] = {
              zio.stream.ZPipeline.mapChunks { (chunk: Chunk[Json]) =>
                chunk.flatMap(encode)
              }
            }
          },
          jsonSchema
        )
    )
  }

}

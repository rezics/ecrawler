import {Effect, Layer, pipe} from "effect"
import {HttpApiBuilder, HttpMiddleware, HttpServer} from "@effect/platform"
import {NodeHttpServer} from "@effect/platform-node"
import {createServer} from "http"
import {ServerConfig} from "../config/index.ts"

export const ServerLive = Layer.unwrapEffect(
  pipe(
    ServerConfig,
    Effect.map(config =>
      NodeHttpServer.layer(createServer, {host: config.host, port: config.port})
    ),
    Effect.map(server =>
      HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
        Layer.provide(server.pipe(HttpServer.withLogAddress))
      )
    )
  )
)

import {Effect, Layer, pipe} from "effect"
import {ServerConfig} from "./config"
import {NodeHttpServer} from "@effect/platform-node"
import {createServer} from "node:http"
import {HttpApiBuilder, HttpMiddleware, HttpServer} from "@effect/platform"

export const ServerLive = Layer.unwrapEffect(
	pipe(
		ServerConfig,
		Effect.map(config => NodeHttpServer.layer(createServer, {host: config.host, port: config.port})),
		Effect.map(server =>
			HttpApiBuilder.serve(HttpMiddleware.logger).pipe(Layer.provide(server.pipe(HttpServer.withLogAddress)))
		)
	)
)

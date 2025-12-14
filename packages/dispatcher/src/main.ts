import {NodeRuntime} from "@effect/platform-node"
import {HttpApiBuilder, HttpMiddleware, HttpServer} from "@effect/platform"
import {NodeHttpServer} from "@effect/platform-node"
import {Effect, Layer, pipe} from "effect"
import {createServer} from "node:http"

import {DispatcherApi} from "@ecrawler/api/dispatcher"
import {TasksHandler} from "./handlers/tasks.ts"
import {WorkerAuthLive} from "./auth.ts"
import {DatabaseLive} from "./database/client.ts"
import {DispatcherConfig} from "./config.ts"

const ApiLive = HttpApiBuilder.api(DispatcherApi).pipe(
	Layer.provide(TasksHandler)
)

const HttpServerLive = Layer.unwrapEffect(
	Effect.map(DispatcherConfig, config =>
		NodeHttpServer.layer(createServer, {port: config.port})
	)
)

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
	Layer.provide(ApiLive),
	Layer.provide(WorkerAuthLive),
	Layer.provide(DatabaseLive),
	HttpServer.withLogAddress,
	Layer.provide(HttpServerLive),
	Layer.provide(DispatcherConfig.Default)
)

const main = pipe(
	Effect.Do,
	Effect.tap(() => Effect.logInfo("Starting Dispatcher Server...")),
	Effect.andThen(() => Layer.launch(ServerLive)),
	Effect.ensuring(Effect.logInfo("Shutting down Dispatcher Server..."))
)

main.pipe(NodeRuntime.runMain)

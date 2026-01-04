import {NodeRuntime} from "@effect/platform-node"
import {HttpApiBuilder, HttpMiddleware, HttpServer} from "@effect/platform"
import {NodeHttpServer} from "@effect/platform-node"
import {Effect, Layer, pipe} from "effect"
import {createServer} from "node:http"

import {CollectorApi} from "@ecrawler/api/collector"
import {ResultsHandler} from "./handlers/results.ts"
import {WorkersHandler} from "./handlers/workers.ts"
import {WorkerAuthLive} from "./auth.ts"
import {DatabaseLive} from "./database/client.ts"
import {CollectorConfig} from "./config.ts"
import {ServerLive as CoreServerLive} from "@ecrawler/core/server/layer.ts"

const ApiLive = HttpApiBuilder.api(CollectorApi).pipe(
	Layer.provide(ResultsHandler),
	Layer.provide(WorkersHandler)
)

const ServerLive = CoreServerLive.pipe(
	Layer.provide(
		Layer.mergeAll(
			ApiLive,
			WorkerAuthLive,
			DatabaseLive,
			CollectorConfig.Default
		)
	)
)

const main = pipe(
	Effect.Do,
	Effect.tap(() => Effect.logInfo("Starting Collector Server...")),
	Effect.andThen(() => Layer.launch(ServerLive)),
	Effect.ensuring(Effect.logInfo("Shutting down Collector Server..."))
)

main.pipe(NodeRuntime.runMain)

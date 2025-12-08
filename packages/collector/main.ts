import {NodeRuntime} from "@effect/platform-node"
import {HttpApiBuilder, HttpMiddleware, HttpServer} from "@effect/platform"
import {NodeHttpServer} from "@effect/platform-node"
import {Effect, Layer} from "effect"
import {createServer} from "node:http"

import CollectorApi from "./services/apis/index.ts"
import ResultsApiLive from "./services/apis/implements/results.ts"
import WorkerAuthLive from "./services/apis/implements/auth.ts"
import DatabaseLive from "./services/databases/index.ts"
import CollectorConfig from "./services/configs/index.ts"

const ConfigLive = CollectorConfig.Default

const ApiLive = HttpApiBuilder.api(CollectorApi).pipe(
	Layer.provide(ResultsApiLive)
)

const HttpServerLive = Layer.unwrapEffect(
	Effect.gen(function* () {
		const config = yield* CollectorConfig
		return NodeHttpServer.layer(createServer, {port: config.port})
	})
)

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
	Layer.provide(ApiLive),
	Layer.provide(WorkerAuthLive),
	Layer.provide(DatabaseLive),
	HttpServer.withLogAddress,
	Layer.provide(HttpServerLive),
	Layer.provide(ConfigLive)
)

const Main = Effect.gen(function* () {
	yield* Effect.logInfo("Starting Collector Server...")
})

Main.pipe(Effect.provide(ServerLive), NodeRuntime.runMain)

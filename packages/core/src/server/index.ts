import {HttpApiBuilder, HttpMiddleware, HttpServer} from "@effect/platform"
import {NodeHttpServer} from "@effect/platform-node"
import {Context, Effect, Layer} from "effect"
import {createServer} from "node:http"

export interface ServerConfig {
	readonly host: string
	readonly port: number
}

export const makeServerLive = <
	ApiLayer extends Layer.Layer<any, any, any>,
	AuthLayer extends Layer.Layer<any, any, any>,
	DatabaseLayer extends Layer.Layer<any, any, any>,
	T extends ServerConfig,
	E
>(options: {
	apiLayer: ApiLayer
	authLayer: AuthLayer
	databaseLayer: DatabaseLayer
	configTag: Context.Tag<T, T> & {Default: Layer.Layer<T, E>}
}) => {
	const HttpServerLive = Layer.unwrapEffect(
		Effect.map(options.configTag, config =>
			NodeHttpServer.layer(createServer, {port: config.port})
		)
	)

	return HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
		Layer.provide(options.apiLayer),
		Layer.provide(options.authLayer),
		Layer.provide(options.databaseLayer),
		HttpServer.withLogAddress,
		Layer.provide(HttpServerLive),
		Layer.provide(options.configTag.Default)
	)
}

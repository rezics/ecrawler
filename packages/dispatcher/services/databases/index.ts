import {PgClient} from "@effect/sql-pg"
import {Effect, Layer} from "effect"
import {DispatcherConfig} from "../configs/index.ts"

const DatabaseConfigEffect = Effect.map(DispatcherConfig, config => ({
	url: config.databaseUrl
}))

export const DatabaseLive = Layer.unwrapEffect(
	Effect.map(DatabaseConfigEffect, config => PgClient.layer(config))
).pipe(Layer.provide(DispatcherConfig.Default))

export default DatabaseLive

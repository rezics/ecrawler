import {PgClient} from "@effect/sql-pg"
import {Effect, Layer} from "effect"
import {CollectorConfig} from "../configs/index.ts"

const DatabaseConfigEffect = Effect.map(CollectorConfig, config => ({
	url: config.databaseUrl
}))

export const DatabaseLive = Layer.unwrapEffect(
	Effect.map(DatabaseConfigEffect, config => PgClient.layer(config))
).pipe(Layer.provide(CollectorConfig.Default))

export default DatabaseLive

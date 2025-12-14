import {PgClient} from "@effect/sql-pg"
import {Context, Effect, Layer, Redacted} from "effect"
import {DatabaseError} from "../errors/index.ts"

export interface DatabaseConfig {
	readonly databaseUrl: Redacted.Redacted<string>
}

export const makeDatabaseLayer = <T extends DatabaseConfig, E>(
	configTag: Context.Tag<T, T> & {Default: Layer.Layer<T, E>}
) => {
	const DatabaseConfigEffect = Effect.map(configTag, config => ({
		url: config.databaseUrl
	}))

	return Layer.unwrapEffect(
		Effect.map(DatabaseConfigEffect, config => PgClient.layer(config))
	).pipe(Layer.provide(configTag.Default))
}

export const mapSqlError = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
	Effect.mapError(effect, e => new DatabaseError({message: String(e)}))

export {DatabaseError} from "../errors/index.ts"

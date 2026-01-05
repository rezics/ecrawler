import {Effect, Layer, pipe} from "effect"
import {DatabaseConfig} from "./config"
import * as PgDrizzle from "@effect/sql-drizzle/Pg"
import {PgClient} from "@effect/sql-pg"

export const DatabaseLive = Layer.unwrapEffect(
	pipe(
		DatabaseConfig,
		Effect.map(config =>
			Layer.provideMerge(
				PgDrizzle.layer,
				PgClient.layer({url: config.url})
			)
		)
	)
)

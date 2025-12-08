import {PgClient} from "@effect/sql-pg"
import {Effect, Layer} from "effect"
import CollectorConfig from "../configs/index.ts"

const DatabaseLive = Layer.unwrapEffect(
	Effect.gen(function* () {
		const config = yield* CollectorConfig
		return PgClient.layer({url: config.databaseUrl})
	})
)

export default DatabaseLive

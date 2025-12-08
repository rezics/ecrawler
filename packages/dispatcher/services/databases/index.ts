import {PgClient} from "@effect/sql-pg"
import {Effect, Layer} from "effect"
import DispatcherConfig from "../configs/index.ts"

const DatabaseLive = Layer.unwrapEffect(
	Effect.gen(function* () {
		const config = yield* DispatcherConfig
		return PgClient.layer({url: config.databaseUrl})
	})
)

export default DatabaseLive

import * as schema from "./schema.ts"
import {Effect, Redacted} from "effect"
import {ServerConfig} from "@ecrawler/core/server/config.js"
import {drizzle} from "drizzle-orm/postgres-js"

export class Database extends Effect.Service<Database>()("@ecrawler/dispatcher/database/client/Database", {
	effect: Effect.gen(function* () {
		const config = yield* ServerConfig
		return drizzle(Redacted.value(config.database.url), {schema})
	})
}) {}

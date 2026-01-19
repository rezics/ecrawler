import * as schema from "./schema.ts"
import {Effect, Redacted, Schedule} from "effect"
import {ServerConfig} from "@ecrawler/core/server/config.ts"
import {drizzle} from "drizzle-orm/postgres-js"
import {migrate} from "drizzle-orm/postgres-js/migrator"
import path from "node:path"
import process from "node:process"

export class Database extends Effect.Service<Database>()("@ecrawler/dispatcher/database/client/Database", {
	effect: Effect.gen(function* () {
		const config = yield* ServerConfig
		const db = drizzle(Redacted.value(config.database.url), {schema})
		yield* Effect.tryPromise(() =>
			migrate(db, {migrationsFolder: path.join(process.cwd(), "src", "database", "migrations")})
		)
		return db
	}).pipe(Effect.retry({schedule: Schedule.spaced("1 seconds"), times: 3}))
}) {}

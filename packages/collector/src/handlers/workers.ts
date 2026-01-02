import {HttpApiBuilder} from "@effect/platform"
import {Effect} from "effect"
import {desc, eq} from "drizzle-orm"
import {CollectorApi} from "@ecrawler/api/collector"
import {mapSqlError, PgDrizzle, schema} from "@ecrawler/core/database"
import {WorkerSecurity} from "@ecrawler/core/auth"

export const WorkersHandler = HttpApiBuilder.group(
	CollectorApi,
	"Workers",
	handlers =>
		Effect.gen(function* () {
			const db = yield* PgDrizzle

			return handlers
				.handle("register", ({payload}) =>
					Effect.gen(function* () {
						const id = crypto.randomUUID()
						yield* db.insert(schema.workers).values({
							id,
							tags: [...payload.tags],
							lastSeen: new Date()
						})
						return {id}
					}).pipe(mapSqlError)
				)
				.handle("heartbeat", () =>
					Effect.gen(function* () {
						const worker = yield* WorkerSecurity
						yield* db
							.update(schema.workers)
							.set({lastSeen: new Date()})
							.where(eq(schema.workers.id, worker.id))
					}).pipe(mapSqlError)
				)
				.handle("list", () =>
					Effect.gen(function* () {
						const result = yield* db
							.select()
							.from(schema.workers)
							.orderBy(desc(schema.workers.lastSeen))
						return result
					}).pipe(mapSqlError)
				)
		})
)

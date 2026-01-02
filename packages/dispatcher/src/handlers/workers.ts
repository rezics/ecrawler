import {HttpApiBuilder} from "@effect/platform"
import {Effect, Schema} from "effect"
import {desc, eq} from "drizzle-orm"
import {DispatcherApi, WorkerNotFoundError} from "@ecrawler/api/dispatcher"
import {WorkerRegistration} from "@ecrawler/schemas"
import {mapSqlError, PgDrizzle, schema} from "@ecrawler/core/database"
import {WorkerSecurity} from "@ecrawler/core/auth"

const decodeWorker = (row: typeof schema.workers.$inferSelect) =>
	Schema.decodeUnknownSync(WorkerRegistration)({
		id: row.id,
		tags: row.tags ?? [],
		lastSeen: row.lastSeen
	})

export const WorkersHandler = HttpApiBuilder.group(
	DispatcherApi,
	"Workers",
	handlers =>
		Effect.gen(function* () {
			const db = yield* PgDrizzle

			return handlers
				.handle("register", ({payload}) =>
					Effect.gen(function* () {
						const id = crypto.randomUUID()
						yield* db
							.insert(schema.workers)
							.values({
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
				.handle("unregister", () =>
					Effect.gen(function* () {
						const worker = yield* WorkerSecurity
						const result = yield* db
							.delete(schema.workers)
							.where(eq(schema.workers.id, worker.id))
							.returning({id: schema.workers.id})
						if (result.length === 0) {
							return yield* Effect.fail(
								new WorkerNotFoundError({
									message: "Worker not found"
								})
							)
						}
					}).pipe(mapSqlError)
				)
				.handle("list", () =>
					Effect.gen(function* () {
						const result = yield* db
							.select()
							.from(schema.workers)
							.orderBy(desc(schema.workers.lastSeen))
						return result.map(decodeWorker)
					}).pipe(mapSqlError)
				)
		})
)

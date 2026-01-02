import {HttpApiBuilder} from "@effect/platform"
import {SqlClient} from "@effect/sql"
import {Effect, Schema} from "effect"
import {and, eq, isNotNull, sql} from "drizzle-orm"
import {DispatcherApi, TaskNotFoundError} from "@ecrawler/api/dispatcher"
import {Task} from "@ecrawler/schemas"
import {mapSqlError, PgDrizzle, schema} from "@ecrawler/core/database"
import {WorkerSecurity} from "@ecrawler/core/auth"

const DEFAULT_TIMEOUT_MINUTES = 30

export const TasksHandler = HttpApiBuilder.group(
	DispatcherApi,
	"Tasks",
	handlers =>
		Effect.gen(function* () {
			const db = yield* PgDrizzle
			const sqlClient = yield* SqlClient.SqlClient

			return handlers
				.handle("add-task", ({payload}) =>
					Effect.gen(function* () {
						const id = crypto.randomUUID()
						yield* db
							.insert(schema.tasks)
							.values({id, tags: [...payload.tags], payload: {}})
						return {id}
					}).pipe(mapSqlError)
				)
				.handle("remove-task", ({payload}) =>
					Effect.gen(function* () {
						yield* db
							.delete(schema.tasks)
							.where(eq(schema.tasks.id, payload.id))
					}).pipe(mapSqlError)
				)
				.handle("next-task", ({payload}) =>
					Effect.gen(function* () {
						const worker = yield* WorkerSecurity
						// Use raw SQL for the complex UPDATE with subquery and FOR UPDATE SKIP LOCKED
						const result = yield* sqlClient`
							UPDATE tasks
							SET assignment = ${worker.id}, assigned_at = NOW()
							WHERE id = (
								SELECT id FROM tasks
								WHERE assignment IS NULL
								AND tags && ${payload.tags}::text[]
								ORDER BY id
								LIMIT 1
								FOR UPDATE SKIP LOCKED
							)
							RETURNING id, tags, payload
						`
						if (result.length === 0) {
							return yield* Effect.fail(
								new TaskNotFoundError({
									message: "No task available"
								})
							)
						}
						return Schema.decodeUnknownSync(
							Task.pipe(Schema.omit("assignment", "assignedAt"))
						)(result[0]!)
					}).pipe(mapSqlError)
				)
				.handle("release-timed-out", ({payload}) =>
					Effect.gen(function* () {
						const timeoutMinutes =
							payload.timeoutMinutes ?? DEFAULT_TIMEOUT_MINUTES
						const result = yield* db
							.update(schema.tasks)
							.set({assignment: null, assignedAt: null})
							.where(
								and(
									isNotNull(schema.tasks.assignment),
									sql`${schema.tasks.assignedAt} < NOW() - (${timeoutMinutes} || ' minutes')::INTERVAL`
								)
							)
							.returning({id: schema.tasks.id})
						return {releasedCount: result.length}
					}).pipe(mapSqlError)
				)
				.handle("complete-task", ({payload}) =>
					Effect.gen(function* () {
						const worker = yield* WorkerSecurity
						const result = yield* db
							.delete(schema.tasks)
							.where(
								and(
									eq(schema.tasks.id, payload.id),
									eq(schema.tasks.assignment, worker.id)
								)
							)
							.returning({id: schema.tasks.id})
						if (result.length === 0) {
							return yield* Effect.fail(
								new TaskNotFoundError({
									message:
										"Task not found or not assigned to this worker"
								})
							)
						}
					}).pipe(mapSqlError)
				)
		})
)

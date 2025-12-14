import {HttpApiBuilder} from "@effect/platform"
import {SqlClient} from "@effect/sql"
import {Effect, Schema} from "effect"
import {DispatcherApi, TaskNotFoundError} from "@ecrawler/api/dispatcher"
import {Task} from "@ecrawler/schemas"
import {mapSqlError} from "@ecrawler/core/database"

export const TasksHandler = HttpApiBuilder.group(
	DispatcherApi,
	"Tasks",
	handlers =>
		Effect.gen(function* () {
			const sql = yield* SqlClient.SqlClient

			return handlers
				.handle("add-task", ({payload}) =>
					Effect.gen(function* () {
						const id = crypto.randomUUID()
						yield* sql`
							INSERT INTO tasks (id, tags, payload)
							VALUES (${id}, ${payload.tags}, ${JSON.stringify({})})
						`
						return {id}
					}).pipe(mapSqlError)
				)
				.handle("remove-task", ({payload}) =>
					Effect.gen(function* () {
						yield* sql`
							DELETE FROM tasks WHERE id = ${payload.id}
						`
					}).pipe(mapSqlError)
				)
				.handle("next-task", ({payload}) =>
					Effect.gen(function* () {
						const result = yield* sql`
							SELECT id, tags, payload
							FROM tasks
							WHERE assignment IS NULL
							AND tags && ${payload.tags}::text[]
							ORDER BY id
							LIMIT 1
							FOR UPDATE SKIP LOCKED
						`
						if (result.length === 0) {
							return yield* Effect.fail(
								new TaskNotFoundError({
									message: "No task available"
								})
							)
						}
						return Schema.decodeUnknownSync(
							Task.pipe(Schema.omit("assignment"))
						)(result[0]!)
					}).pipe(mapSqlError)
				)
		})
)

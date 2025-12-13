import {HttpApiBuilder} from "@effect/platform"
import {SqlClient} from "@effect/sql"
import {Effect, Option} from "effect"
import {CollectorApi} from "../index.ts"
import {Result} from "../../schemas/Result.ts"
import {ResultNotFoundError} from "../interfaces/results/index.ts"
import {DatabaseError} from "../interfaces/errors/index.ts"
import {WorkerSecurity} from "../interfaces/auth/index.ts"
import {Schema} from "effect"

const mapSqlError = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
	Effect.mapError(effect, e => new DatabaseError({message: String(e)}))

const decodeResult = (row: Record<string, unknown>) =>
	Schema.decodeUnknownSync(Result)({
		id: row["id"],
		taskId: row["task_id"],
		workerId: row["worker_id"],
		status: row["status"],
		data: row["data"],
		error: row["error"] ? Option.some(row["error"]) : Option.none(),
		collectedAt: row["collected_at"]
	})

export const ResultsApiLive = HttpApiBuilder.group(
	CollectorApi,
	"Results",
	handlers =>
		Effect.gen(function* () {
			const sql = yield* SqlClient.SqlClient

			return handlers
				.handle("submitSuccess", ({payload}) =>
					Effect.gen(function* () {
						const worker = yield* WorkerSecurity
						const id = crypto.randomUUID()
						yield* sql`
							INSERT INTO results (id, task_id, worker_id, status, data)
							VALUES (${id}, ${payload.taskId}, ${worker.id}, ${"success"}, ${JSON.stringify(payload.data)})
						`
						return {id}
					}).pipe(mapSqlError)
				)
				.handle("submitFailure", ({payload}) =>
					Effect.gen(function* () {
						const worker = yield* WorkerSecurity
						const id = crypto.randomUUID()
						yield* sql`
							INSERT INTO results (id, task_id, worker_id, status, data, error)
							VALUES (${id}, ${payload.taskId}, ${worker.id}, ${"failure"}, ${JSON.stringify({})}, ${JSON.stringify(payload.error)})
						`
						return {id}
					}).pipe(mapSqlError)
				)
				.handle("list", ({urlParams}) =>
					Effect.gen(function* () {
						const limit = urlParams.limit ?? 100
						const offset = urlParams.offset ?? 0

						const result = urlParams.taskId
							? urlParams.status
								? yield* sql`
									SELECT id, task_id, worker_id, status, data, error, collected_at
									FROM results
									WHERE task_id = ${urlParams.taskId} AND status = ${urlParams.status}
									ORDER BY collected_at DESC
									LIMIT ${limit} OFFSET ${offset}
								`
								: yield* sql`
									SELECT id, task_id, worker_id, status, data, error, collected_at
									FROM results
									WHERE task_id = ${urlParams.taskId}
									ORDER BY collected_at DESC
									LIMIT ${limit} OFFSET ${offset}
								`
							: urlParams.status
							? yield* sql`
									SELECT id, task_id, worker_id, status, data, error, collected_at
									FROM results
									WHERE status = ${urlParams.status}
									ORDER BY collected_at DESC
									LIMIT ${limit} OFFSET ${offset}
								`
							: yield* sql`
									SELECT id, task_id, worker_id, status, data, error, collected_at
									FROM results
									ORDER BY collected_at DESC
									LIMIT ${limit} OFFSET ${offset}
								`

						return result.map(decodeResult)
					}).pipe(mapSqlError)
				)
				.handle("get", ({path}) =>
					Effect.gen(function* () {
						const result = yield* sql`
							SELECT id, task_id, worker_id, status, data, error, collected_at
							FROM results
							WHERE id = ${path.id}
						`
						if (result.length === 0) {
							return yield* Effect.fail(
								new ResultNotFoundError({
									message: "Result not found"
								})
							)
						}
						return decodeResult(result[0]!)
					}).pipe(mapSqlError)
				)
				.handle("delete", ({path}) =>
					Effect.gen(function* () {
						const result = yield* sql`
							DELETE FROM results WHERE id = ${path.id} RETURNING id
						`
						if (result.length === 0) {
							return yield* Effect.fail(
								new ResultNotFoundError({
									message: "Result not found"
								})
							)
						}
					}).pipe(mapSqlError)
				)
		})
)

export default ResultsApiLive

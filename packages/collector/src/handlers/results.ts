import {HttpApiBuilder} from "@effect/platform"
import {Effect, Layer, Schema} from "effect"
import {and, desc, eq} from "drizzle-orm"
import {CollectorApi, ResultNotFoundError} from "@ecrawler/api/collector"
import {Result} from "@ecrawler/schemas"
import {WorkerSecurity} from "@ecrawler/core/auth/index.ts"
import {DatabaseLive} from "../database/client"
import {PgDrizzle} from "@effect/sql-drizzle/Pg"
import * as schema from "../database/schema.ts"

export const ResultsHandler = HttpApiBuilder.group(
	CollectorApi,
	"Results",
	handlers =>
		Effect.gen(function* () {
			const db = yield* PgDrizzle

			return handlers
				.handle("submitSuccess", ({payload}) =>
					Effect.gen(function* () {
						const worker = yield* WorkerSecurity
						const id = crypto.randomUUID()
						yield* db.insert(schema.results).values({})
						return {id}
					}).pipe(mapSqlError)
				)
				.handle("submitFailure", ({payload}) =>
					Effect.gen(function* () {
						const worker = yield* WorkerSecurity
						const id = crypto.randomUUID()
						yield* db.insert(schema.results).values({
							id,
							taskId: payload.taskId,
							workerId: worker.id,
							status: "failure",
							data: {},
							error: payload.error
						})
						return {id}
					}).pipe(mapSqlError)
				)
				.handle("list", ({urlParams}) =>
					Effect.gen(function* () {
						const limit = urlParams.limit ?? 100
						const offset = urlParams.offset ?? 0

						const conditions = []
						if (urlParams.taskId) {
							conditions.push(
								eq(schema.results.taskId, urlParams.taskId)
							)
						}
						if (urlParams.status) {
							conditions.push(
								eq(schema.results.status, urlParams.status)
							)
						}

						const query = db
							.select()
							.from(schema.results)
							.orderBy(desc(schema.results.collectedAt))
							.limit(limit)
							.offset(offset)

						const result =
							conditions.length > 0
								? yield* query.where(and(...conditions))
								: yield* query

						return result.map(row =>
							Schema.decodeUnknownSync(Result)({
								id: row.id,
								taskId: row.taskId,
								workerId: row.workerId,
								status: row.status,
								data: row.data,
								error: row.error,
								collectedAt: row.collectedAt
							})
						)
					}).pipe(mapSqlError)
				)
				.handle("get", ({path}) =>
					Effect.gen(function* () {
						const result = yield* db
							.select()
							.from(schema.results)
							.where(eq(schema.results.id, path.id))
						if (result.length === 0) {
							return yield* Effect.fail(
								new ResultNotFoundError({
									message: "Result not found"
								})
							)
						}
						return Schema.decodeUnknownSync(Result)({
							id: result[0]!.id,
							taskId: result[0]!.taskId,
							workerId: result[0]!.workerId,
							status: result[0]!.status,
							data: result[0]!.data,
							error: result[0]!.error,
							collectedAt: result[0]!.collectedAt
						})
					}).pipe(mapSqlError)
				)
				.handle("delete", ({path}) =>
					Effect.gen(function* () {
						const result = yield* db
							.delete(schema.results)
							.where(eq(schema.results.id, path.id))
							.returning({id: schema.results.id})
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

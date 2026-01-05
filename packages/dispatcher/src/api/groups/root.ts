import Api, {TaskNotFoundError} from "@ecrawler/api/dispatcher/index.ts"
import {HttpApiBuilder} from "@effect/platform"
import {PgDrizzle} from "@effect/sql-drizzle/Pg"
import {Array, Effect, Layer} from "effect"
import * as schema from "../../database/schema.ts"
import {and, arrayContains, eq, gte, lt, SQL} from "drizzle-orm"
import {UnknownError} from "@ecrawler/core/api/error.js"

export default Layer.unwrapEffect(
	Effect.gen(function* () {
		const drizzle = yield* PgDrizzle

		return HttpApiBuilder.group(Api, "dispatcher", handlers =>
			handlers
				.handle("health", () => Effect.succeed(void {}))
				.handle("createTask", ({payload}) =>
					drizzle
						.insert(schema.tasks)
						.values({
							tags: Array.fromIterable(payload.tags),
							data: payload.data
						})
						.returning()
						.pipe(Effect.flatMap(Array.head), UnknownError.mapError)
				)
				.handle("deleteTask", ({path}) =>
					drizzle
						.delete(schema.tasks)
						.where(eq(schema.tasks.id, path.id))
						.returning({id: schema.tasks.id})
						.pipe(
							Effect.flatMap(Array.head),
							Effect.catchTag("NoSuchElementException", () =>
								Effect.fail(new TaskNotFoundError())
							),
							Effect.asVoid,
							UnknownError.mapError
						)
				)
				.handle("updateTask", ({path, payload}) =>
					drizzle
						.update(schema.tasks)
						.set({
							tags: payload.tags
								? Array.fromIterable(payload.tags)
								: undefined,
							data: payload.data
						})
						.where(eq(schema.tasks.id, path.id))
						.returning()
						.pipe(
							Effect.flatMap(Array.head),
							Effect.catchTag("NoSuchElementException", () =>
								Effect.fail(new TaskNotFoundError())
							),
							UnknownError.mapError
						)
				)
				.handle("getTasks", ({urlParams}) =>
					drizzle
						.select()
						.from(schema.tasks)
						.where(
							and(
								...[
									urlParams.id &&
										eq(schema.tasks.id, urlParams.id),
									urlParams.hold !== undefined &&
										eq(schema.tasks.hold, urlParams.hold),
									urlParams.tags &&
										arrayContains(
											schema.tasks.tags,
											Array.fromIterable(urlParams.tags)
										),
									urlParams.since &&
										gte(
											schema.tasks.created_at,
											urlParams.since
										),
									urlParams.before &&
										lt(
											schema.tasks.created_at,
											urlParams.before
										)
								].filter(v => v instanceof SQL)
							)
						)
						.limit(urlParams.limit ?? 100)
						.offset(urlParams.offset ?? 0)
						.pipe(UnknownError.mapError)
				)
				.handle("nextTask", ({urlParams}) =>
					drizzle
						.update(schema.tasks)
						.set({hold: true})
						.where(
							and(
								eq(schema.tasks.hold, false),
								arrayContains(
									schema.tasks.tags,
									Array.fromIterable(urlParams.tags)
								)
							)
						)
						.returning()
						.pipe(
							Effect.flatMap(Array.head),
							Effect.catchTag("NoSuchElementException", () =>
								Effect.fail(new TaskNotFoundError())
							),
							UnknownError.mapError
						)
				)
				.handle("holdTask", ({path}) =>
					drizzle
						.update(schema.tasks)
						.set({hold: true})
						.where(eq(schema.tasks.id, path.id))
						.returning({id: schema.tasks.id})
						.pipe(
							Effect.flatMap(Array.head),
							Effect.catchTag("NoSuchElementException", () =>
								Effect.fail(new TaskNotFoundError())
							),
							Effect.asVoid,
							UnknownError.mapError
						)
				)
		)
	})
)

import Api from "@ecrawler/api/dispatcher/index.ts"
import {TaskNotFoundError} from "@ecrawler/api/dispatcher/groups/root.ts"
import {HttpApiBuilder} from "@effect/platform"
import {Array, Effect, Layer, Schedule, Duration, pipe, Option} from "effect"
import * as schema from "../../database/schema.ts"
import {and, arrayContained, eq, gte, lt, SQL, asc, isNull} from "drizzle-orm"
import {UnknownError} from "@ecrawler/core/api/error.js"
import {Database} from "../../database/client.ts"

export default Layer.unwrapEffect(
	Effect.gen(function* () {
		const drizzle = yield* Database

		return HttpApiBuilder.group(Api, "dispatcher", handlers =>
			handlers
				.handle("createTask", ({payload}) =>
					pipe(
						Effect.tryPromise(() =>
							drizzle
								.insert(schema.tasks)
								.values({tags: Array.fromIterable(payload.tags), link: payload.link})
								.returning({id: schema.tasks.id})
						),
						Effect.flatMap(Array.head),
						UnknownError.mapError
					)
				)
				.handle("deleteTask", ({path}) =>
					pipe(
						Effect.tryPromise(() =>
							drizzle
								.delete(schema.tasks)
								.where(eq(schema.tasks.id, path.id))
								.returning({id: schema.tasks.id})
						),
						Effect.flatMap(Array.head),
						Effect.catchTag("NoSuchElementException", () => Effect.fail(new TaskNotFoundError())),
						Effect.asVoid,
						UnknownError.mapError
					)
				)
				.handle("updateTask", ({path, payload}) =>
					pipe(
						Effect.tryPromise(() =>
							drizzle
								.update(schema.tasks)
								.set({
									tags: payload.tags ? Array.fromIterable(payload.tags) : undefined,
									link: payload.link
								})
								.where(eq(schema.tasks.id, path.id))
								.returning()
						),
						Effect.flatMap(Array.head),
						Effect.catchTag("NoSuchElementException", () => Effect.fail(new TaskNotFoundError())),
						UnknownError.mapError
					)
				)
				.handle("getTasks", ({urlParams}) =>
					pipe(
						Effect.tryPromise(() =>
							drizzle
								.select()
								.from(schema.tasks)
								.where(
									and(
										...[
											urlParams.id && eq(schema.tasks.id, urlParams.id),
											urlParams.by && eq(schema.tasks.by, urlParams.by),
											urlParams.tags &&
												arrayContained(schema.tasks.tags, Array.fromIterable(urlParams.tags)),
											urlParams.since && gte(schema.tasks.created_at, urlParams.since),
											urlParams.before && lt(schema.tasks.created_at, urlParams.before)
										].filter(v => v instanceof SQL)
									)
								)
								.orderBy(asc(schema.tasks.created_at))
								.limit(urlParams.limit ?? 100)
								.offset(urlParams.offset ?? 0)
						),
						UnknownError.mapError
					)
				)
				.handle("nextTask", ({payload, urlParams}) =>
					pipe(
						Effect.tryPromise(() =>
							drizzle.transaction(async tx => {
								const [task] = await tx
									.select()
									.from(schema.tasks)
									.where(
										and(
											isNull(schema.tasks.by),
											...[
												urlParams.id && eq(schema.tasks.id, urlParams.id),
												urlParams.tags &&
													arrayContained(
														schema.tasks.tags,
														Array.fromIterable(urlParams.tags)
													),
												urlParams.since && gte(schema.tasks.created_at, urlParams.since),
												urlParams.before && lt(schema.tasks.created_at, urlParams.before)
											].filter(v => v instanceof SQL)
										)
									)
									.orderBy(asc(schema.tasks.created_at))
									.limit(1)
									.for("update", {skipLocked: true})

								if (!task) {
									throw new TaskNotFoundError()
								}

								const [updated] = await tx
									.update(schema.tasks)
									.set({by: payload.by})
									.where(eq(schema.tasks.id, task.id))
									.returning()

								return updated
							})
						),
						Effect.flatMap(Option.fromNullable),
						Effect.catchTag("NoSuchElementException", () => Effect.fail(new TaskNotFoundError())),
						Effect.retry(Schedule.spaced("1 seconds")),
						Effect.timeout(Duration.seconds(urlParams.timeout ?? 30)),
						UnknownError.mapError
					)
				)
		)
	})
)

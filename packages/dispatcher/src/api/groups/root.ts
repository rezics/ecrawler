import Api from "@ecrawler/api/dispatcher/index.ts"
import {TaskNotFoundError} from "@ecrawler/api/dispatcher/groups/root.ts"
import {HttpApiBuilder} from "@effect/platform"
import {PgDrizzle} from "@effect/sql-drizzle/Pg"
import {Array, Effect, flow, Layer, Match} from "effect"
import * as schema from "../../database/schema.ts"
import {and, arrayContained, eq, gte, lt, SQL, asc, isNull} from "drizzle-orm"
import {UnknownError} from "@ecrawler/core/api/error.js"

export default Layer.unwrapEffect(
	Effect.gen(function* () {
		const drizzle = yield* PgDrizzle

		return HttpApiBuilder.group(Api, "dispatcher", handlers =>
			handlers
				.handle("createTask", ({payload}) =>
					drizzle
						.insert(schema.tasks)
						.values({tags: Array.fromIterable(payload.tags), link: payload.link})
						.returning({id: schema.tasks.id})
						.pipe(Effect.flatMap(Array.head), UnknownError.mapError)
				)
				.handle("deleteTask", ({path}) =>
					drizzle
						.delete(schema.tasks)
						.where(eq(schema.tasks.id, path.id))
						.returning({id: schema.tasks.id})
						.pipe(
							Effect.flatMap(Array.head),
							Effect.catchTag("NoSuchElementException", () => Effect.fail(new TaskNotFoundError())),
							Effect.asVoid,
							UnknownError.mapError
						)
				)
				.handle("updateTask", ({path, payload}) =>
					drizzle
						.update(schema.tasks)
						.set({tags: payload.tags ? Array.fromIterable(payload.tags) : undefined, link: payload.link})
						.where(eq(schema.tasks.id, path.id))
						.returning()
						.pipe(
							Effect.flatMap(Array.head),
							Effect.catchTag("NoSuchElementException", () => Effect.fail(new TaskNotFoundError())),
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
						.pipe(UnknownError.mapError)
				)
				.handle("nextTask", ({payload, urlParams}) =>
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
												arrayContained(schema.tasks.tags, Array.fromIterable(urlParams.tags)),
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
					).pipe(
						Effect.flatMap(
							flow(
								Match.value,
								Match.when(Match.defined, v => Effect.succeed(v)),
								Match.orElse(() => Effect.fail(new TaskNotFoundError()))
							)
						),
						UnknownError.mapError
					)
				)
		)
	})
)

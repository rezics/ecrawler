import Api, {ResultNotFoundError} from "@ecrawler/api/collector/index.ts"
import {HttpApiBuilder} from "@effect/platform"
import {Array, Effect, Layer} from "effect"
import * as schema from "../../database/schema.ts"
import {and, arrayContained, eq, gte, lt, SQL} from "drizzle-orm"
import {UnknownError} from "@ecrawler/core/api/error.js"
import {Database} from "../../database/client.ts"

export default Layer.unwrapEffect(
	Effect.gen(function* () {
		const drizzle = yield* Database

		return HttpApiBuilder.group(Api, "collector", handlers =>
			handlers
				.handle("createResult", ({payload}) =>
					drizzle
						.insert(schema.results)
						.values({
							by: payload.by,
							tags: Array.fromIterable(payload.tags),
							link: payload.link,
							data: payload.data
						})
						.returning({id: schema.results.id})
						.pipe(Effect.flatMap(Array.head), UnknownError.mapError)
				)
				.handle("deleteResult", ({path}) =>
					drizzle
						.delete(schema.results)
						.where(eq(schema.results.id, path.id))
						.returning({id: schema.results.id})
						.pipe(
							Effect.flatMap(Array.head),
							Effect.catchTag("NoSuchElementException", () => Effect.fail(new ResultNotFoundError())),
							Effect.asVoid,
							UnknownError.mapError
						)
				)
				.handle("updateResult", ({path, payload}) =>
					drizzle
						.update(schema.results)
						.set({
							...(payload.by !== undefined && {by: payload.by}),
							...(payload.tags !== undefined && {tags: Array.fromIterable(payload.tags)}),
							...(payload.link !== undefined && {link: payload.link}),
							...(payload.data !== undefined && {data: payload.data})
						})
						.where(eq(schema.results.id, path.id))
						.returning({id: schema.results.id})
						.pipe(
							Effect.flatMap(Array.head),
							Effect.catchTag("NoSuchElementException", () => Effect.fail(new ResultNotFoundError())),
							Effect.asVoid,
							UnknownError.mapError
						)
				)
				.handle("getResults", ({urlParams}) =>
					drizzle
						.select()
						.from(schema.results)
						.where(
							and(
								...[
									urlParams.id && eq(schema.results.id, urlParams.id),
									urlParams.by && eq(schema.results.by, urlParams.by),
									urlParams.tags &&
										arrayContained(schema.results.tags, Array.fromIterable(urlParams.tags)),
									urlParams.since && gte(schema.results.created_at, urlParams.since),
									urlParams.before && lt(schema.results.created_at, urlParams.before)
								].filter(v => v instanceof SQL)
							)
						)
						.limit(urlParams.limit ?? 100)
						.offset(urlParams.offset ?? 0)
						.pipe(UnknownError.mapError)
				)
		)
	})
)

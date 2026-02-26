import Api from "@ecrawler/api/collector/index.ts"
import DispatcherApi from "@ecrawler/api/dispatcher/index.ts"
import {ResultNotFoundError} from "@ecrawler/api/schemas/Result.ts"
import {TaskNotFoundError} from "@ecrawler/api/schemas/Task.ts"
import {HttpApiBuilder} from "@effect/platform"
import {Array, Effect, Layer, Schedule, Duration, pipe, Option} from "effect"
import * as schema from "../../database/schema.ts"
import {and, eq, gte, lt, SQL, asc, isNull} from "drizzle-orm"
import {UnknownError} from "@ecrawler/core/api/error.ts"
import {Database} from "../../database/client.ts"
import {
  tagsContained as tagsContainedFilter,
  tagsContains as tagsContainsFilter
} from "../../database/sqlite-tags.ts"

const collectorGroup = Layer.unwrapEffect(
  Effect.gen(function* () {
    const drizzle = yield* Database

    return HttpApiBuilder.group(Api, "collector", handlers =>
      handlers
        .handle("createResult", ({payload}) =>
          pipe(
            Effect.tryPromise(() =>
              drizzle
                .insert(schema.results)
                .values({
                  by: payload.by,
                  tags: Array.fromIterable(payload.tags),
                  link: payload.link,
                  data: payload.data
                })
                .returning({id: schema.results.id})
            ),
            Effect.flatMap(Array.head),
            UnknownError.mapError
          )
        )
        .handle("deleteResult", ({path}) =>
          pipe(
            Effect.tryPromise(() =>
              drizzle
                .delete(schema.results)
                .where(eq(schema.results.id, path.id))
                .returning({id: schema.results.id})
            ),
            Effect.flatMap(Array.head),
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(new ResultNotFoundError())
            ),
            Effect.asVoid,
            UnknownError.mapError
          )
        )
        .handle("updateResult", ({path, payload}) =>
          pipe(
            Effect.tryPromise(() =>
              drizzle
                .update(schema.results)
                .set({
                  ...(payload.by !== undefined && {by: payload.by}),
                  ...(payload.tags !== undefined && {
                    tags: Array.fromIterable(payload.tags)
                  }),
                  ...(payload.link !== undefined && {link: payload.link}),
                  ...(payload.data !== undefined && {data: payload.data})
                })
                .where(eq(schema.results.id, path.id))
                .returning({id: schema.results.id})
            ),
            Effect.flatMap(Array.head),
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(new ResultNotFoundError())
            ),
            Effect.asVoid,
            UnknownError.mapError
          )
        )
        .handle("getResults", ({urlParams}) =>
          pipe(
            Effect.tryPromise(() =>
              drizzle
                .select()
                .from(schema.results)
                .where(
                  and(
                    ...[
                      urlParams.id && eq(schema.results.id, urlParams.id),
                      urlParams.by && eq(schema.results.by, urlParams.by),
                      urlParams.tags &&
                        tagsContainedFilter(
                          schema.results.tags,
                          Array.fromIterable(urlParams.tags)
                        ),
                      urlParams.since &&
                        gte(schema.results.created_at, urlParams.since),
                      urlParams.before &&
                        lt(schema.results.created_at, urlParams.before)
                    ].filter(v => v instanceof SQL)
                  )
                )
                .limit(urlParams.limit ?? 100)
                .offset(urlParams.offset ?? 0)
            ),
            UnknownError.mapError
          )
        )
    )
  })
)

const dispatcherGroup = Layer.unwrapEffect(
  Effect.gen(function* () {
    const drizzle = yield* Database

    return HttpApiBuilder.group(DispatcherApi, "dispatcher", handlers =>
      handlers
        .handle("createTask", ({payload}) =>
          pipe(
            Effect.tryPromise(() =>
              drizzle
                .insert(schema.tasks)
                .values({tags: Array.dedupe(payload.tags), link: payload.link})
                .onConflictDoNothing()
                .returning({id: schema.tasks.id})
            ),
            Effect.map(Array.head),
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
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(new TaskNotFoundError())
            ),
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
                  tags: payload.tags ? Array.dedupe(payload.tags) : undefined,
                  link: payload.link
                })
                .where(eq(schema.tasks.id, path.id))
                .returning()
            ),
            Effect.flatMap(Array.head),
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(new TaskNotFoundError())
            ),
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
                        tagsContainsFilter(
                          schema.tasks.tags,
                          Array.fromIterable(urlParams.tags)
                        ),
                      urlParams.since &&
                        gte(schema.tasks.created_at, urlParams.since),
                      urlParams.before &&
                        lt(schema.tasks.created_at, urlParams.before)
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
                          tagsContainsFilter(
                            schema.tasks.tags,
                            Array.fromIterable(urlParams.tags)
                          ),
                        urlParams.since &&
                          gte(schema.tasks.created_at, urlParams.since),
                        urlParams.before &&
                          lt(schema.tasks.created_at, urlParams.before)
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
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(new TaskNotFoundError())
            ),
            Effect.retry(Schedule.spaced("1 seconds")),
            Effect.timeoutFail({
              duration: Duration.seconds(urlParams.timeout ?? 30),
              onTimeout: () => new TaskNotFoundError()
            }),
            UnknownError.mapError
          )
        )
    )
  })
)

export default Layer.merge(collectorGroup, dispatcherGroup)

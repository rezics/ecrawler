import Api from "@ecrawler/api/collector/index.ts"
import DispatcherApi from "@ecrawler/api/dispatcher/index.ts"
import {UnknownError} from "@ecrawler/api/error.ts"
import {ResultNotFoundError} from "@ecrawler/api/schemas/Result.ts"
import {TaskNotFoundError} from "@ecrawler/api/schemas/Task.ts"
import {HttpApiBuilder} from "@effect/platform"
import {Array, Effect, Layer, Schedule, Duration, pipe} from "effect"
import {and, arrayContains, asc, eq, gte, lt, SQL} from "drizzle-orm"

const LEASE_DURATION_MS = Duration.toMillis(Duration.minutes(5))
import * as schema from "../../database/schemas"
import {Database} from "../../database/index.ts"

const collectorGroup = Layer.unwrapEffect(
  Effect.gen(function* () {
    const db = yield* Database

    return HttpApiBuilder.group(Api, "collector", handlers =>
      handlers
        .handle("createResult", ({payload}) =>
          pipe(
            db
              .insert(schema.results)
              .values({
                tags: Array.fromIterable(payload.tags),
                link: payload.link,
                meta: payload.meta,
                data: payload.data
              })
              .returning({id: schema.results.id}),
            UnknownError.mapError,
            Effect.map(rows => rows[0]!)
          )
        )
        .handle("deleteResult", ({path}) =>
          pipe(
            db
              .delete(schema.results)
              .where(eq(schema.results.id, path.id))
              .returning({id: schema.results.id}),
            UnknownError.mapError,
            Effect.flatMap(rows =>
              Array.head(rows).pipe(
                Effect.mapError(() => new ResultNotFoundError()),
                Effect.asVoid
              )
            )
          )
        )
        .handle("updateResult", ({path, payload}) =>
          pipe(
            db
              .update(schema.results)
              .set({
                ...(payload.tags !== undefined && {
                  tags: Array.fromIterable(payload.tags)
                }),
                ...(payload.link !== undefined && {link: payload.link}),
                ...(payload.meta !== undefined && {meta: payload.meta}),
                ...(payload.data !== undefined && {data: payload.data})
              })
              .where(eq(schema.results.id, path.id))
              .returning({id: schema.results.id}),
            UnknownError.mapError,
            Effect.flatMap(rows =>
              Array.head(rows).pipe(
                Effect.mapError(() => new ResultNotFoundError()),
                Effect.asVoid
              )
            )
          )
        )
        .handle("getResults", ({urlParams}) =>
          pipe(
            db
              .select()
              .from(schema.results)
              .where(
                and(
                  ...[
                    urlParams.id && eq(schema.results.id, urlParams.id),
                    urlParams.tags &&
                      arrayContains(
                        schema.results.tags,
                        Array.fromIterable(urlParams.tags)
                      ),
                    urlParams.since &&
                      gte(schema.results.created_at, urlParams.since),
                    urlParams.before &&
                      lt(schema.results.created_at, urlParams.before)
                  ].filter((v): v is SQL => v instanceof SQL)
                )
              )
              .limit(urlParams.limit ?? 100)
              .offset(urlParams.offset ?? 0),
            UnknownError.mapError,
            Effect.map(rows => {
              const withTaskId = rows.filter(
                (r): r is typeof r & {task_id: string} => r.task_id != null
              )
              return urlParams.data
                ? withTaskId
                : withTaskId.map(({data: _data, ...rest}) => rest)
            })
          )
        )
    )
  })
)

const dispatcherGroup = Layer.unwrapEffect(
  Effect.gen(function* () {
    const db = yield* Database

    return HttpApiBuilder.group(DispatcherApi, "dispatcher", handlers =>
      handlers
        .handle("createTask", ({payload}) =>
          pipe(
            db
              .insert(schema.tasks)
              .values({
                tags: Array.dedupe(Array.fromIterable(payload.tags)),
                link: payload.link,
                meta: payload.meta
              })
              .onConflictDoNothing()
              .returning({id: schema.tasks.id}),
            UnknownError.mapError,
            Effect.map(Array.head)
          )
        )
        .handle("deleteTask", ({path}) =>
          pipe(
            db
              .delete(schema.tasks)
              .where(eq(schema.tasks.id, path.id))
              .returning({id: schema.tasks.id}),
            UnknownError.mapError,
            Effect.flatMap(rows =>
              Array.head(rows).pipe(
                Effect.mapError(() => new TaskNotFoundError()),
                Effect.asVoid
              )
            )
          )
        )
        .handle("updateTask", ({path, payload}) =>
          pipe(
            db
              .update(schema.tasks)
              .set({
                ...(payload.tags && {
                  tags: Array.dedupe(Array.fromIterable(payload.tags))
                }),
                ...(payload.link !== undefined && {link: payload.link}),
                ...(payload.meta !== undefined && {meta: payload.meta})
              })
              .where(eq(schema.tasks.id, path.id))
              .returning(),
            UnknownError.mapError,
            Effect.flatMap(rows =>
              Array.head(rows).pipe(
                Effect.mapError(() => new TaskNotFoundError())
              )
            )
          )
        )
        .handle("getTasks", ({urlParams}) =>
          pipe(
            db
              .select()
              .from(schema.tasks)
              .where(
                and(
                  ...[
                    urlParams.id && eq(schema.tasks.id, urlParams.id),
                    urlParams.tags &&
                      arrayContains(
                        schema.tasks.tags,
                        Array.fromIterable(urlParams.tags)
                      ),
                    urlParams.since &&
                      gte(schema.tasks.created_at, urlParams.since),
                    urlParams.before &&
                      lt(schema.tasks.created_at, urlParams.before)
                  ].filter((v): v is SQL => v instanceof SQL)
                )
              )
              .orderBy(asc(schema.tasks.created_at))
              .limit(urlParams.limit ?? 100)
              .offset(urlParams.offset ?? 0),
            UnknownError.mapError
          )
        )
        .handle("nextTask", ({urlParams, payload}) =>
          pipe(
            db.transaction(tx =>
              Effect.gen(function* () {
                const [task] = yield* tx
                  .select()
                  .from(schema.tasks)
                  .where(
                    and(
                      eq(schema.tasks.status, "pending"),
                      ...[
                        urlParams.id && eq(schema.tasks.id, urlParams.id),
                        urlParams.tags &&
                          arrayContains(
                            schema.tasks.tags,
                            Array.fromIterable(urlParams.tags)
                          ),
                        urlParams.since &&
                          gte(schema.tasks.created_at, urlParams.since),
                        urlParams.before &&
                          lt(schema.tasks.created_at, urlParams.before)
                      ].filter((v): v is SQL => v instanceof SQL)
                    )
                  )
                  .orderBy(asc(schema.tasks.created_at))
                  .limit(1)
                  .for("update", {skipLocked: true})

                if (!task) {
                  return yield* new TaskNotFoundError()
                }

                const [updated] = yield* tx
                  .update(schema.tasks)
                  .set({
                    status: "processing",
                    worker_id: payload.workerId,
                    lease_expires_at: new Date(Date.now() + LEASE_DURATION_MS)
                  })
                  .where(eq(schema.tasks.id, task.id))
                  .returning()

                if (!updated) {
                  return yield* new TaskNotFoundError()
                }
                return updated
              })
            ),
            UnknownError.mapError,
            Effect.retry(Schedule.spaced("1 seconds")),
            Effect.timeoutFail({
              duration: Duration.seconds(urlParams.timeout ?? 30),
              onTimeout: () => new TaskNotFoundError()
            })
          )
        )
        .handle("renewLease", ({path, payload}) =>
          pipe(
            db
              .update(schema.tasks)
              .set({lease_expires_at: new Date(Date.now() + LEASE_DURATION_MS)})
              .where(
                and(
                  eq(schema.tasks.id, path.id),
                  eq(schema.tasks.worker_id, payload.workerId),
                  eq(schema.tasks.status, "processing")
                )
              )
              .returning({id: schema.tasks.id}),
            UnknownError.mapError,
            Effect.flatMap(rows =>
              Array.head(rows).pipe(
                Effect.mapError(() => new TaskNotFoundError()),
                Effect.asVoid
              )
            )
          )
        )
    )
  })
)

export default Layer.merge(collectorGroup, dispatcherGroup)

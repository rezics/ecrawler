import {Effect, Layer, Schedule, Duration} from "effect"
import {lt, and, eq} from "drizzle-orm"
import {Database} from "../database/index.ts"
import * as schema from "../database/schemas/index.ts"

const REAPER_INTERVAL = Duration.minutes(1)

const reap = (db: typeof Database.Service) =>
  db
    .update(schema.tasks)
    .set({status: "pending", worker_id: null, lease_expires_at: null})
    .where(
      and(
        eq(schema.tasks.status, "processing"),
        lt(schema.tasks.lease_expires_at, new Date())
      )
    )
    .returning({id: schema.tasks.id})

export class LeaseReaper extends Effect.Tag("LeaseReaper")<
  LeaseReaper,
  never
>() {
  static readonly Default = Layer.scopedDiscard(
    Effect.gen(function* () {
      const db = yield* Database

      yield* reap(db).pipe(
        Effect.flatMap(rows =>
          rows.length > 0
            ? Effect.log(`LeaseReaper: reclaimed ${rows.length} expired task(s)`)
            : Effect.void
        ),
        Effect.repeat(Schedule.spaced(REAPER_INTERVAL)),
        Effect.forkScoped
      )
    })
  )
}

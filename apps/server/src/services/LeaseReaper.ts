import {Effect, Layer, Schedule, Duration} from "effect"
import {and, eq, isNotNull, lt} from "drizzle-orm"
import {Database} from "../database/index.ts"
import * as schema from "../database/schemas/index.ts"

const REAPER_INTERVAL = Duration.minutes(1)

const reapExpiredLeases = Effect.gen(function* () {
  const db = yield* Database
  const rows = yield* db
    .update(schema.tasks)
    .set({status: "pending", worker_id: null, lease_expires_at: null})
    .where(
      and(
        eq(schema.tasks.status, "processing"),
        isNotNull(schema.tasks.lease_expires_at),
        lt(schema.tasks.lease_expires_at, new Date())
      )
    )
    .returning({id: schema.tasks.id})

  if (rows.length > 0) {
    yield* Effect.log(`LeaseReaper: reclaimed ${rows.length} expired task(s)`)
  }
})

export const LeaseReaper = Layer.scopedDiscard(
  Effect.forkScoped(
    Effect.repeat(reapExpiredLeases, Schedule.spaced(REAPER_INTERVAL))
  )
)

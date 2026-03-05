import {Context, Effect, Layer} from "effect"
import * as PgClient from "@effect/sql-pg/PgClient"
import * as PgDrizzle from "drizzle-orm/effect-postgres"
import {ServerConfig} from "../../config"
import * as schemas from "../schemas"

type Schemas = typeof schemas

export class Database extends Context.Tag(
  "@ecrawler/server/database/services/Database"
)<Database, PgDrizzle.EffectPgDatabase<Schemas>>() {
  static readonly layer = Layer.unwrapEffect(
    Effect.gen(function* () {
      const config = yield* ServerConfig

      return Layer.effect(
        Database,
        PgDrizzle.makeWithDefaults({schema: schemas}).pipe(
          Effect.provide(
            Layer.mergeAll(
              PgDrizzle.DefaultServices,
              PgClient.layer({
                applicationName: "ecrawler",
                url: config.database
              })
            )
          )
        )
      )
    })
  )
}

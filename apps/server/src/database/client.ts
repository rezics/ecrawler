import {drizzle} from "drizzle-orm/libsql"
import {migrate} from "drizzle-orm/libsql/migrator"
import {Effect} from "effect"
import {dirname, join} from "node:path"
import {fileURLToPath} from "node:url"

const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL
  if (url === undefined || url === "") {
    throw new Error("DATABASE_URL is required")
  }
  return url
}

const migrationsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  "migrations"
)

export class Database extends Effect.Service<Database>()(
  "@ecrawler/server/database/client",
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      const url = yield* Effect.try(() => getDatabaseUrl()).pipe(
        Effect.mapError(
          e =>
            new Error(
              e instanceof Error ? e.message : "DATABASE_URL is required"
            )
        )
      )
      const db = drizzle(url)
      yield* Effect.promise(() => migrate(db, {migrationsFolder}))
      return db
    })
  }
) {}

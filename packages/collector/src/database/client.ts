import * as PgDrizzle from "@effect/sql-drizzle/Pg"
import * as schema from "./schema.ts"

export {DatabaseLive} from "@ecrawler/core/database/layer.ts"

export const Database = PgDrizzle.make({schema})

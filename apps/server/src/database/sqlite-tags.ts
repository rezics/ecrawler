import {sql, type SQL} from "drizzle-orm"
import type {AnyColumn} from "drizzle-orm"

/**
 * SQLite-compatible "column's JSON array contains all of the given tags".
 * Use instead of arrayContains (Postgres @>) when using Libsql/SQLite.
 */
export function tagsContains(
  column: AnyColumn,
  tags: ReadonlyArray<string>
): SQL {
  if (tags.length === 0) {
    return sql`1 = 0`
  }
  const placeholders = sql.join(
    tags.map(t => sql`${t}`),
    sql`, `
  )
  return sql`(SELECT COUNT(*) FROM json_each(${column}) WHERE value IN (${placeholders})) = ${tags.length}`
}

/**
 * SQLite-compatible "column's JSON array is contained in (subset of) the given tags".
 * Use instead of arrayContained (Postgres <@) when using Libsql/SQLite.
 */
export function tagsContained(
  column: AnyColumn,
  tags: ReadonlyArray<string>
): SQL {
  if (tags.length === 0) {
    return sql`1 = 0`
  }
  const placeholders = sql.join(
    tags.map(t => sql`${t}`),
    sql`, `
  )
  return sql`(SELECT COUNT(*) FROM json_each(${column}) WHERE value IN (${placeholders})) = (SELECT COUNT(*) FROM json_each(${column}))`
}

import {pgTable, uuid, timestamp, text, unique} from "drizzle-orm/pg-core"
import {v7} from "uuid"
import {token} from "./token.ts"

export const tasks = pgTable(
  "tasks",
  {
    id: uuid()
      .primaryKey()
      .notNull()
      .$defaultFn(() => v7()),
    by: uuid(),
    created_at: timestamp({withTimezone: true}).notNull().defaultNow(),
    updated_at: timestamp({withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    tags: text().array().notNull().default([]),
    link: text().notNull()
  },
  t => [unique().on(t.tags, t.link)]
)

export {token}

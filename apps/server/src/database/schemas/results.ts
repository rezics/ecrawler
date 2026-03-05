import {jsonb, pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core"
import {v7 as uuidv7} from "uuid"

import {tasks} from "./tasks.ts"

export const results = pgTable("results", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  tags: text("tags").array().notNull(),
  link: text("link").notNull(),
  meta: jsonb("meta"),

  data: jsonb("data").notNull(),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),

  task_id: uuid("task_id").references(() => tasks.id)
})

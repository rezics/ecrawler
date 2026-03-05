import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"
import {v7 as uuidv7} from "uuid"

export const TaskStatus = pgEnum("task_status", [
  "pending",
  "processing",
  "completed"
])

export const tasks = pgTable("tasks", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  status: TaskStatus("status").notNull().default("pending"),
  tags: text("tags").array().notNull(),
  link: text("link").notNull(),
  meta: jsonb("meta"),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
})

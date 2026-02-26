import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull()
})

export const link = sqliteTable("link", {
  id: text("id").primaryKey(),
  url: text("url").notNull()
})

export const token = sqliteTable("token", {
  data: text("data").primaryKey().notNull()
})

export const tasks = sqliteTable("tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  created_at: integer("created_at", {mode: "timestamp_ms"})
    .notNull()
    .$defaultFn(() => Date.now()),
  updated_at: integer("updated_at", {mode: "timestamp_ms"})
    .notNull()
    .$defaultFn(() => Date.now()),
  tags: text("tags", {mode: "json"}).$type<string[]>().notNull(),
  link: text("link").notNull(),
  by: text("by")
})

export const results = sqliteTable("results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  created_at: integer("created_at", {mode: "timestamp_ms"})
    .notNull()
    .$defaultFn(() => Date.now()),
  updated_at: integer("updated_at", {mode: "timestamp_ms"})
    .notNull()
    .$defaultFn(() => Date.now()),
  tags: text("tags", {mode: "json"}).$type<string[]>().notNull(),
  link: text("link").notNull(),
  by: text("by").notNull(),
  data: text("data", {mode: "json"}).$type<unknown>()
})

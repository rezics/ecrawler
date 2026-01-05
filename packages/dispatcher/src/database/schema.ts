import {token} from "@ecrawler/core/database/schema.ts"
import {pgTable, uuid, timestamp, jsonb, text, boolean} from "drizzle-orm/pg-core"
import {v7} from "uuid"

export const tasks = pgTable("tasks", {
	id: uuid()
		.primaryKey()
		.notNull()
		.$defaultFn(() => v7()),
	created_at: timestamp({withTimezone: true}).notNull().defaultNow(),
	updated_at: timestamp({withTimezone: true})
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	tags: text().array().notNull().default([]),
	data: jsonb(),
	hold: boolean().notNull().default(false)
})

export {token}

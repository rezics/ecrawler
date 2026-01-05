import {token} from "@ecrawler/core/database/schema.ts"
import {pgTable, uuid, timestamp, jsonb, text} from "drizzle-orm/pg-core"
import {v7} from "uuid"

export const results = pgTable("results", {
	id: uuid()
		.primaryKey()
		.notNull()
		.$defaultFn(() => v7()),
	by: uuid().notNull(),
	created_at: timestamp({withTimezone: true}).notNull().defaultNow(),
	updated_at: timestamp({withTimezone: true})
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	tags: text().array().notNull().default([]),
	data: jsonb().notNull().unique()
})

export {token}

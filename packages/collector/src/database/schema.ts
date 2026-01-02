import {pgTable, uuid, timestamp, jsonb} from "drizzle-orm/pg-core"
import {v7} from "uuid"

export const results = pgTable("results", {
	id: uuid()
		.primaryKey()
		.notNull()
		.$defaultFn(() => v7()),
	worker_id: uuid().notNull(),
	reported_at: timestamp({withTimezone: true}).notNull().defaultNow(),
	data: jsonb(),
	error: jsonb()
})

import {pgTable, uuid, text, timestamp} from "drizzle-orm/pg-core"

export const workers = pgTable("workers", {
	id: uuid().primaryKey().notNull(),
	/** the tags the worker is subscribed to */
	tags: text().array().notNull(),
	registered_at: timestamp().notNull().defaultNow(),
	last_seen: timestamp({withTimezone: true}).notNull()
})

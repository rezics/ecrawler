import {pgTable, text} from "drizzle-orm/pg-core"

export const token = pgTable("token", {
	data: text().primaryKey().notNull()
})

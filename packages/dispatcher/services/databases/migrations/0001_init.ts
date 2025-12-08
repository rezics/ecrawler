import {SqlClient} from "@effect/sql"
import {Effect} from "effect"

export default SqlClient.SqlClient.pipe(
	Effect.flatMap(sql =>
		Effect.all([
			sql`
				CREATE TABLE workers (
					id UUID PRIMARY KEY
				)
			`,
			sql`
				CREATE TABLE tasks (
					id UUID PRIMARY KEY,
					tags TEXT[] NOT NULL,
					assignment UUID REFERENCES workers(id),
					payload JSONB NOT NULL
				)
			`
		])
	)
)

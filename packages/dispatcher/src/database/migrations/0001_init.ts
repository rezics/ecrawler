import {SqlClient} from "@effect/sql"
import {Effect} from "effect"

export default SqlClient.SqlClient.pipe(
	Effect.flatMap(sql =>
		Effect.all([
			sql`
				CREATE TABLE workers (
					id UUID PRIMARY KEY,
					tags TEXT[] NOT NULL DEFAULT '{}',
					last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
				)
			`,
			sql`
				CREATE TABLE tasks (
					id UUID PRIMARY KEY,
					tags TEXT[] NOT NULL,
					assignment UUID REFERENCES workers(id),
					assigned_at TIMESTAMPTZ,
					payload JSONB NOT NULL
				)
			`,
			sql`
				CREATE INDEX idx_tasks_assignment ON tasks(assignment)
			`,
			sql`
				CREATE INDEX idx_tasks_assigned_at ON tasks(assigned_at)
			`
		])
	)
)

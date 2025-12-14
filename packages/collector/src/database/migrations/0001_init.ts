import {SqlClient} from "@effect/sql"
import {Effect} from "effect"

export default SqlClient.SqlClient.pipe(
	Effect.flatMap(sql =>
		Effect.all([
			sql`
				CREATE TABLE results (
					id UUID PRIMARY KEY,
					task_id UUID NOT NULL,
					worker_id UUID NOT NULL,
					status VARCHAR(16) NOT NULL,
					data JSONB NOT NULL,
					error JSONB,
					collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
				)
			`,
			sql`
				CREATE INDEX idx_results_status ON results(status)
			`,
			sql`
				CREATE INDEX idx_results_task_id ON results(task_id)
			`,
			sql`
				CREATE INDEX idx_results_worker_id ON results(worker_id)
			`,
			sql`
				CREATE INDEX idx_results_collected_at ON results(collected_at)
			`
		])
	)
)

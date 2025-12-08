import {SqlClient} from "@effect/sql"
import {Effect, Layer} from "effect"
import {WorkerAuth, AuthError} from "../interfaces/auth/index.ts"
import Worker from "../../schemas/Worker.ts"
import {Schema} from "effect"

const WorkerAuthLive = Layer.effect(
	WorkerAuth,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient

		return WorkerAuth.of({
			bearer: token =>
				Effect.gen(function* () {
					const result = yield* sql`
						SELECT id
						FROM workers
						WHERE id = ${token}
					`
					if (result.length === 0) {
						return yield* Effect.fail(
							new AuthError({message: "Invalid or expired token"})
						)
					}

					const worker = result[0]!
					return Schema.decodeUnknownSync(Worker)({
						id: worker["id"],
						tasks: []
					})
				}).pipe(
					Effect.catchTag("SqlError", () =>
						Effect.fail(new AuthError({message: "Database error"}))
					)
				)
		})
	})
)

export default WorkerAuthLive

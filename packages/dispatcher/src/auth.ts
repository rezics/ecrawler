import {SqlClient} from "@effect/sql"
import {Effect, Layer, Schema} from "effect"
import {WorkerAuth, AuthError} from "@ecrawler/core/auth"
import {WorkerRegistration} from "@ecrawler/schemas"

export const WorkerAuthLive = Layer.effect(
	WorkerAuth,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient

		return WorkerAuth.of({
			bearer: token =>
				Effect.gen(function* () {
					const result = yield* sql`
						SELECT id FROM workers WHERE id = ${token}
					`
					if (result.length === 0) {
						return yield* Effect.fail(
							new AuthError({message: "Invalid or expired token"})
						)
					}
					const worker = result[0]!
					return Schema.decodeUnknownSync(WorkerRegistration)({
						id: worker["id"],
						tags: [],
						lastSeen: new Date().toISOString()
					})
				}).pipe(
					Effect.catchTag("SqlError", () =>
						Effect.fail(new AuthError({message: "Database error"}))
					)
				)
		})
	})
)

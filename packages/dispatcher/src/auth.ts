import {Effect, Layer, Redacted, Schema} from "effect"
import {eq} from "drizzle-orm"
import {WorkerAuth, AuthError} from "@ecrawler/core/auth"
import {WorkerRegistration} from "@ecrawler/schemas"
import {PgDrizzle, schema} from "@ecrawler/core/database"

export const WorkerAuthLive = Layer.effect(
	WorkerAuth,
	Effect.gen(function* () {
		const db = yield* PgDrizzle

		return WorkerAuth.of({
			bearer: token =>
				Effect.gen(function* () {
					const tokenValue = Redacted.value(token)
					const result = yield* db
						.select({id: schema.workers.id})
						.from(schema.workers)
						.where(eq(schema.workers.id, tokenValue))
					if (result.length === 0) {
						return yield* Effect.fail(
							new AuthError({message: "Invalid or expired token"})
						)
					}
					const worker = result[0]!
					return Schema.decodeUnknownSync(WorkerRegistration)({
						id: worker.id,
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

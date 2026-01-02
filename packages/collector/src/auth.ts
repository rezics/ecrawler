import {Effect, Layer, Redacted} from "effect"
import {eq} from "drizzle-orm"
import {WorkerAuth, WorkerIdentity, AuthError} from "@ecrawler/core/auth"
import {PgDrizzle, schema} from "@ecrawler/core/database"

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const WorkerAuthLive = Layer.effect(
	WorkerAuth,
	Effect.gen(function* () {
		const db = yield* PgDrizzle

		return WorkerAuth.of({
			bearer: token =>
				Effect.gen(function* () {
					const tokenValue = Redacted.value(token)
					if (!UUID_REGEX.test(tokenValue)) {
						return yield* Effect.fail(
							new AuthError({message: "Invalid token format"})
						)
					}
					const result = yield* db
						.select({id: schema.workers.id})
						.from(schema.workers)
						.where(eq(schema.workers.id, tokenValue))
					if (result.length === 0) {
						return yield* Effect.fail(
							new AuthError({message: "Invalid or expired token"})
						)
					}
					return WorkerIdentity.make({id: tokenValue})
				}).pipe(
					Effect.catchTag("SqlError", () =>
						Effect.fail(new AuthError({message: "Database error"}))
					)
				)
		})
	})
)

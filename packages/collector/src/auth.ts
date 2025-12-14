import {Effect, Layer, Redacted, Schema} from "effect"
import {WorkerAuth, WorkerIdentity, AuthError} from "@ecrawler/core/auth"

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const WorkerAuthLive = Layer.succeed(
	WorkerAuth,
	WorkerAuth.of({
		bearer: token =>
			Effect.gen(function* () {
				const tokenValue = Redacted.value(token)
				if (!UUID_REGEX.test(tokenValue)) {
					return yield* Effect.fail(
						new AuthError({message: "Invalid token format"})
					)
				}
				return Schema.decodeUnknownSync(WorkerIdentity)({
					id: tokenValue
				})
			})
	})
)

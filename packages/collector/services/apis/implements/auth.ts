import {Effect, Layer, Redacted} from "effect"
import {WorkerAuth, AuthError} from "../interfaces/auth/index.ts"
import {Schema} from "effect"

const Worker = Schema.Struct({id: Schema.UUID})

const WorkerAuthLive = Layer.succeed(
	WorkerAuth,
	WorkerAuth.of({
		bearer: token =>
			Effect.gen(function* () {
				// 简单验证 token 是否为有效的 UUID 格式
				const tokenValue = Redacted.value(token)
				const uuidRegex =
					/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
				if (!uuidRegex.test(tokenValue)) {
					return yield* Effect.fail(
						new AuthError({message: "Invalid token format"})
					)
				}

				return Schema.decodeUnknownSync(Worker)({id: tokenValue})
			})
	})
)

export default WorkerAuthLive

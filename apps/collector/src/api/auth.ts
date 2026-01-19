import {Auth, AuthError} from "@ecrawler/core/api/auth.ts"
import {Array, Effect, Layer, pipe, Redacted} from "effect"
import * as schema from "../database/schema.ts"
import {eq} from "drizzle-orm"
import {UnknownError} from "@ecrawler/core/api/error.ts"
import {Database} from "../database/client.ts"

export default Layer.effect(
	Auth,
	Database.pipe(
		Effect.map(drizzle =>
			Auth.of({
				bearer: token =>
					pipe(
						Effect.tryPromise(() =>
							drizzle
								.select()
								.from(schema.token)
								.where(
									eq(schema.token.data, Redacted.value(token))
								)
						),
						UnknownError.mapError,
						Effect.map(Array.length),
						Effect.filterOrFail(
							length => length > 0,
							() => new AuthError({message: "Invalid token"})
						),
						Effect.asVoid
					)
			})
		)
	)
)

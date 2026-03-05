import {Auth, AuthError} from "@ecrawler/api/middlewares/Auth.ts"
import {UnknownError} from "@ecrawler/api/error.ts"
import {Effect, Layer, pipe, Redacted} from "effect"
import {eq} from "drizzle-orm"
import * as schema from "../../database/schemas/index.ts"
import {Database} from "../../database/index.ts"

export default Layer.effect(
  Auth,
  Effect.gen(function* () {
    const db = yield* Database
    return Auth.of({
      bearer: token =>
        pipe(
          db
            .select()
            .from(schema.token)
            .where(eq(schema.token.data, Redacted.value(token))),
          UnknownError.mapError,
          Effect.map((rows: {data: string}[]) => rows.length),
          Effect.filterOrFail(
            length => length > 0,
            () => new AuthError({message: "Invalid token"})
          ),
          Effect.asVoid
        )
    })
  })
)

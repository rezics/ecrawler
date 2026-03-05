import {
  MaxBodySize,
  PayloadTooLargeError
} from "@ecrawler/api/middlewares/MaxBodySize.ts"
import {HttpServerRequest} from "@effect/platform"
import {Effect, Layer, Option} from "effect"

const ONE_MB = 1024 * 1024

export default Layer.sync(MaxBodySize, () =>
  MaxBodySize.of(
    Effect.catchAll(
      HttpServerRequest.withMaxBodySize(Option.some(ONE_MB))(Effect.void),
      () => Effect.fail(new PayloadTooLargeError({limit: ONE_MB}))
    )
  )
)

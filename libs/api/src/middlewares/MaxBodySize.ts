import {HttpApiMiddleware} from "@effect/platform"
import {Schema} from "effect"
import {UnknownError} from "../error.ts"

export class PayloadTooLargeError extends Schema.TaggedError<PayloadTooLargeError>()(
  "PayloadTooLargeError",
  {limit: Schema.Number}
) {}

export class MaxBodySize extends HttpApiMiddleware.Tag<MaxBodySize>()(
  "MaxBodySizeMiddleware",
  {optional: false, failure: Schema.Union(PayloadTooLargeError, UnknownError)}
) {}

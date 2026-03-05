import {Schema} from "effect"

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  {}
) {}

export class RateLimited extends Schema.TaggedError<RateLimited>()(
  "RateLimited",
  {}
) {}

export class ServerError extends Schema.TaggedError<ServerError>()(
  "ServerError",
  {cause: Schema.optional(Schema.Unknown)}
) {}

export class Exhausted extends Schema.TaggedError<Exhausted>()(
  "Exhausted",
  {}
) {}

export const NetworkProxyError = Schema.Union(
  Unauthorized,
  RateLimited,
  ServerError,
  Exhausted
)
export type NetworkProxyError = typeof NetworkProxyError.Type

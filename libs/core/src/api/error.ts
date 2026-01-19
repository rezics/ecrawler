import {Effect, flow, Schema} from "effect"

export class UnknownError extends Schema.TaggedError<UnknownError>()("UnknownError", {}) {
  public static mapError = flow(
    Effect.tapErrorCause(cause => Effect.logError("Unknown error occurred:", cause)),
    Effect.mapError(() => new UnknownError())
  )
}

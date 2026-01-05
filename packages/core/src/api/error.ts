import {Effect, Schema} from "effect"

export class UnknownError extends Schema.TaggedError<UnknownError>()(
	"UnknownError",
	{}
) {
	public static mapError = Effect.mapError(() => new UnknownError())
}

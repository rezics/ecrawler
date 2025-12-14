import {Schema} from "effect"

export class DatabaseError extends Schema.TaggedError<DatabaseError>()(
	"DatabaseError",
	{message: Schema.String}
) {}

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
	message: Schema.String
}) {}

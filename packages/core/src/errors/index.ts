import {Schema} from "effect"
import {SqlError as _SqlError} from "@effect/sql"

export class DatabaseError extends Schema.TaggedError<DatabaseError>()(
	"DatabaseError",
	{message: Schema.String}
) {}

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
	message: Schema.String
}) {}

export class SqlError extends Schema.TaggedError<SqlError>()("SqlError", {
	message: Schema.optional(Schema.String)
}) {}

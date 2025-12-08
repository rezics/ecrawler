import {HttpApiMiddleware, HttpApiSecurity} from "@effect/platform"
import {Schema, Context} from "effect"

const Worker = Schema.Struct({id: Schema.UUID})

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
	message: Schema.String
}) {}

export class WorkerSecurity extends Context.Tag("WorkerSecurity")<
	WorkerSecurity,
	typeof Worker.Type
>() {}

export class WorkerAuth extends HttpApiMiddleware.Tag<WorkerAuth>()(
	"WorkerAuth",
	{
		failure: AuthError,
		provides: WorkerSecurity,
		security: {bearer: HttpApiSecurity.bearer}
	}
) {}

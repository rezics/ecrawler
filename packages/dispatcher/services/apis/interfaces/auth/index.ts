import {HttpApiMiddleware, HttpApiSecurity} from "@effect/platform"
import {Effect, Schema} from "effect"
import {Worker} from "../../../schemas/Worker.ts"

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
	message: Schema.String
}) {}

export class WorkerSecurity extends Effect.Tag(
	"@ecrawler/dispatcher/WorkerSecurity"
)<WorkerSecurity, typeof Worker.Type>() {}

export class WorkerAuth extends HttpApiMiddleware.Tag<WorkerAuth>()(
	"@ecrawler/dispatcher/WorkerAuth",
	{
		failure: AuthError,
		provides: WorkerSecurity,
		security: {bearer: HttpApiSecurity.bearer}
	}
) {}

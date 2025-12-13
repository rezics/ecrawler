import {HttpApiMiddleware, HttpApiSecurity} from "@effect/platform"
import {Effect, Schema} from "effect"

export const WorkerIdentity = Schema.Struct({id: Schema.UUID})
export type WorkerIdentity = typeof WorkerIdentity.Type

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
	message: Schema.String
}) {}

export class WorkerSecurity extends Effect.Tag(
	"@ecrawler/collector/WorkerSecurity"
)<WorkerSecurity, WorkerIdentity>() {}

export class WorkerAuth extends HttpApiMiddleware.Tag<WorkerAuth>()(
	"@ecrawler/collector/WorkerAuth",
	{
		failure: AuthError,
		provides: WorkerSecurity,
		security: {bearer: HttpApiSecurity.bearer}
	}
) {}

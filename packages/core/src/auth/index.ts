import {HttpApiMiddleware, HttpApiSecurity} from "@effect/platform"
import {Effect, Schema} from "effect"
import {AuthError} from "../errors/index.ts"

export const WorkerIdentity = Schema.Struct({id: Schema.UUID})
export type WorkerIdentity = typeof WorkerIdentity.Type

export class WorkerSecurity extends Effect.Tag("@ecrawler/core/WorkerSecurity")<
	WorkerSecurity,
	WorkerIdentity
>() {}

export class WorkerAuth extends HttpApiMiddleware.Tag<WorkerAuth>()(
	"@ecrawler/core/WorkerAuth",
	{
		failure: AuthError,
		provides: WorkerSecurity,
		security: {bearer: HttpApiSecurity.bearer}
	}
) {}

export {AuthError} from "../errors/index.ts"

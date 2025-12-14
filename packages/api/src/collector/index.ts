import {HttpApi} from "@effect/platform"
import {ResultsApi} from "./endpoints/results.ts"
import {WorkerAuth, AuthError} from "@ecrawler/core/auth"
import {DatabaseError} from "@ecrawler/core/errors"

export const CollectorApi = HttpApi.make("CollectorApi")
	.add(ResultsApi)
	.addError(AuthError)
	.addError(DatabaseError)
	.middleware(WorkerAuth)

export {ResultsApi, ResultNotFoundError} from "./endpoints/results.ts"

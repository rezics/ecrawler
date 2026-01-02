import {HttpApi} from "@effect/platform"
import {ResultsApi} from "./endpoints/results.ts"
import {WorkersApi} from "./endpoints/workers.ts"
import {WorkerAuth, AuthError} from "@ecrawler/core/auth"
import {DatabaseError} from "@ecrawler/core/errors"

export const CollectorApi = HttpApi.make("CollectorApi")
	.add(ResultsApi)
	.add(WorkersApi)
	.addError(AuthError)
	.addError(DatabaseError)
	.middleware(WorkerAuth)

export {ResultsApi, ResultNotFoundError} from "./endpoints/results.ts"
export {WorkersApi, WorkerNotFoundError} from "./endpoints/workers.ts"

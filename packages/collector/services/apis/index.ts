import {HttpApi} from "@effect/platform"
import {ResultsApi} from "./interfaces/results/index.ts"
import {WorkerAuth, AuthError} from "./interfaces/auth/index.ts"
import {DatabaseError} from "./interfaces/errors/index.ts"

export const CollectorApi = HttpApi.make("CollectorApi")
	.add(ResultsApi)
	.addError(AuthError)
	.addError(DatabaseError)
	.middleware(WorkerAuth)

export default CollectorApi

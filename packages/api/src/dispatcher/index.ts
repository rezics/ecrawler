import {HttpApi} from "@effect/platform"
import {TasksApi} from "./endpoints/tasks.ts"
import {WorkersApi} from "./endpoints/workers.ts"
import {WorkerAuth, AuthError} from "@ecrawler/core/auth"
import {DatabaseError} from "@ecrawler/core/errors"

export const DispatcherApi = HttpApi.make("DispatcherApi")
	.add(TasksApi)
	.add(WorkersApi)
	.addError(AuthError)
	.addError(DatabaseError)
	.middleware(WorkerAuth)

export {TasksApi, TaskNotFoundError} from "./endpoints/tasks.ts"
export {
	WorkersApi,
	WorkerNotFoundError,
	WorkerAlreadyExistsError
} from "./endpoints/workers.ts"

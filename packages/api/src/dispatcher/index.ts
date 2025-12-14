import {HttpApi} from "@effect/platform"
import {TasksApi} from "./endpoints/tasks.ts"
import {WorkerAuth, AuthError} from "@ecrawler/core/auth"
import {DatabaseError} from "@ecrawler/core/errors"

export const DispatcherApi = HttpApi.make("DispatcherApi")
	.add(TasksApi)
	.addError(AuthError)
	.addError(DatabaseError)
	.middleware(WorkerAuth)

export {TasksApi, TaskNotFoundError} from "./endpoints/tasks.ts"

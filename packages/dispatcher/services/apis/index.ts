import {HttpApi} from "@effect/platform"
import TasksApi from "./interfaces/tasks/index.ts"
import {WorkerAuth, AuthError} from "./interfaces/auth/index.ts"
import {DatabaseError} from "./interfaces/errors/index.ts"

const DispatcherApi = HttpApi.make("DispatcherApi")
	.add(TasksApi)
	.addError(AuthError)
	.addError(DatabaseError)
	.middleware(WorkerAuth)

export default DispatcherApi

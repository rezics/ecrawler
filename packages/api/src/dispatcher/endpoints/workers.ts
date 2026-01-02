import {HttpApiEndpoint, HttpApiGroup} from "@effect/platform"
import {WorkerRegistration} from "@ecrawler/schemas"
import {Schema} from "effect"
import {TaggedError} from "effect/Data"

export class WorkerAlreadyExistsError extends Schema.TaggedError<WorkerAlreadyExistsError>()(
	"WorkerAlreadyExistsError",
	{message: Schema.String}
) {}

export class WorkerNotFoundError extends Schema.TaggedError<WorkerNotFoundError>()(
	"WorkerNotFoundError",
	{message: Schema.String}
) {}

export const RegisterWorkerPayload = Schema.Struct({
	tags: Schema.Array(Schema.String)
})

export const WorkerIdResponse = Schema.Struct({id: Schema.UUID})

export const WorkersApi = HttpApiGroup.make("Workers")
	.add(
		HttpApiEndpoint.post("register")`/`
			.setPayload(RegisterWorkerPayload)
			.addSuccess(WorkerIdResponse)
	)
	.add(HttpApiEndpoint.post("heartbeat")`/heartbeat`.addSuccess(Schema.Void))
	.add(
		HttpApiEndpoint.del("unregister")`/`
			.addSuccess(Schema.Void)
			.addError(WorkerNotFoundError)
	)
	.add(
		HttpApiEndpoint.get("list")`/`.addSuccess(
			Schema.Array(WorkerRegistration)
		)
	)

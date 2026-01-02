import {HttpApiEndpoint, HttpApiGroup} from "@effect/platform"
import {WorkerRegistration} from "@ecrawler/schemas"
import {Schema} from "effect"

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
		HttpApiEndpoint.post("register")`/workers`
			.setPayload(RegisterWorkerPayload)
			.addSuccess(WorkerIdResponse)
	)
	.add(
		HttpApiEndpoint.post("heartbeat")`/workers/heartbeat`.addSuccess(
			Schema.Void
		)
	)
	.add(
		HttpApiEndpoint.get("list")`/workers`.addSuccess(
			Schema.Array(WorkerRegistration)
		)
	)

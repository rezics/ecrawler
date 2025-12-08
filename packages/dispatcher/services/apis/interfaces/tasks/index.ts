import {HttpApiEndpoint, HttpApiGroup} from "@effect/platform"
import Task from "../../../schemas/Task.ts"
import {Schema} from "effect"

export class TaskNotFoundError extends Schema.TaggedError<TaskNotFoundError>()(
	"TaskNotFoundError",
	{message: Schema.String}
) {}

export default HttpApiGroup.make("Tasks")
	.add(
		HttpApiEndpoint.post("add-task")`/`
			.setPayload(Task.omit("assignment", "payload", "id"))
			.addSuccess(Task.pick("id"))
	)
	.add(
		HttpApiEndpoint.del(`remove-task`)`/`
			.setPayload(Task.pick("id"))
			.addSuccess(Schema.Void)
	)
	.add(
		HttpApiEndpoint.get(`next-task`)`/`
			.setPayload(Schema.Struct({tags: Schema.String.pipe(Schema.Array)}))
			.addSuccess(Task.omit("assignment"))
			.addError(TaskNotFoundError)
	)

import {HttpApiEndpoint, HttpApiGroup} from "@effect/platform"
import {Task} from "@ecrawler/schemas"
import {Schema} from "effect"

export class TaskNotFoundError extends Schema.TaggedError<TaskNotFoundError>()(
	"TaskNotFoundError",
	{message: Schema.String}
) {}

export const NextTaskPayload = Schema.Struct({
	tags: Schema.Array(Schema.String)
})

export const TaskIdResponse = Schema.Struct({id: Schema.UUID})

const TaskWithoutAssignment = Task.pipe(Schema.omit("assignment"))

export const TasksApi = HttpApiGroup.make("Tasks")
	.add(
		HttpApiEndpoint.post("add-task")`/`
			.setPayload(Schema.Struct({tags: Schema.Array(Schema.String)}))
			.addSuccess(TaskIdResponse)
	)
	.add(
		HttpApiEndpoint.del("remove-task")`/`
			.setPayload(TaskIdResponse)
			.addSuccess(Schema.Void)
	)
	.add(
		HttpApiEndpoint.get("next-task")`/`
			.setPayload(NextTaskPayload)
			.addSuccess(TaskWithoutAssignment)
			.addError(TaskNotFoundError)
	)

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

export const ReleaseTimedOutPayload = Schema.Struct({
	timeoutMinutes: Schema.optional(Schema.Number)
})

export const ReleaseTimedOutResponse = Schema.Struct({
	releasedCount: Schema.Number
})

const TaskWithoutAssignment = Task.pipe(Schema.omit("assignment", "assignedAt"))

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
	.add(
		HttpApiEndpoint.post("release-timed-out")`/release-timed-out`
			.setPayload(ReleaseTimedOutPayload)
			.addSuccess(ReleaseTimedOutResponse)
	)
	.add(
		HttpApiEndpoint.post("complete-task")`/complete`
			.setPayload(TaskIdResponse)
			.addSuccess(Schema.Void)
			.addError(TaskNotFoundError)
	)

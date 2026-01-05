import {Task} from "@ecrawler/schemas/task"
import {HttpApiEndpoint, HttpApiGroup, OpenApi} from "@effect/platform"
import {Schema} from "effect"
import {UnknownError} from "@ecrawler/core/api/error.js"

export class TaskNotFoundError extends Schema.TaggedError<TaskNotFoundError>()(
	"TaskNotFoundError",
	{}
) {}

const QueryParams = Schema.Struct({
	id: Schema.UUID.annotations({
		description: "Filter by task ID\n\n按任务 ID 筛选"
	}),
	hold: Schema.BooleanFromString.annotations({
		description: "Filter by hold status\n\n按挂起状态筛选"
	}),
	tags: Schema.String.pipe(Schema.Array).annotations({
		description:
			"Filter by tags (all tags must match)\n\n按标签筛选（必须匹配所有标签）"
	}),
	since: Schema.Date.annotations({
		description:
			"Filter tasks created after this date\n\n筛选在此日期之后创建的任务"
	}),
	before: Schema.Date.annotations({
		description:
			"Filter tasks created before this date\n\n筛选在此日期之前创建的任务"
	}),
	data: Schema.BooleanFromString.annotations({
		description:
			"Whether to include full data in the response\n\n是否在响应中包含完整数据"
	}),
	limit: Schema.NumberFromString.annotations({
		description: "Maximum number of tasks to return\n\n返回任务的最大数量"
	}),
	offset: Schema.NumberFromString.annotations({
		description: "Number of tasks to skip\n\n要跳过的任务数量"
	})
})
	.annotations({
		identifier: "TaskQueryParams",
		description: "Query parameters for listing tasks\n\n列出任务的查询参数"
	})
	.pipe(Schema.partial)

const CreatePayload = Schema.Struct({
	tags: Schema.String.pipe(Schema.Array).annotations({
		description: "Tags for the new task\n\n新任务的标签"
	}),
	data: Schema.Any.annotations({
		description: "The task data\n\n任务数据"
	})
}).annotations({
	identifier: "CreateTaskPayload",
	description: "Payload for creating a new task\n\n创建新任务的载荷"
})

const UpdatePayload = Schema.Struct({
	tags: Schema.String.pipe(Schema.Array).annotations({
		description: "New tags for the task\n\n任务的新标签"
	}),
	data: Schema.Any.annotations({
		description: "New data for the task\n\n任务的新数据"
	})
})
	.annotations({
		identifier: "UpdateTaskPayload",
		description:
			"Payload for updating an existing task\n\n更新现有任务的载荷"
	})
	.pipe(Schema.partial)

export default HttpApiGroup.make("dispatcher")
	.annotate(
		OpenApi.Description,
		"Operations related to task dispatching and queue management\n\n与任务调度和队列管理相关的操作"
	)
	.addError(UnknownError)
	.add(
		HttpApiEndpoint.head("health")`/health`
			.addSuccess(Schema.Void)
			.annotate(OpenApi.Summary, "Check health status")
			.annotate(
				OpenApi.Description,
				"Checks if the dispatcher service is healthy\n\n检查调度器服务是否健康"
			)
	)
	.add(
		HttpApiEndpoint.post("createTask")`/tasks`
			.setPayload(CreatePayload)
			.addSuccess(Schema.Struct({id: Schema.UUID}))

			.annotate(OpenApi.Summary, "Create a new task")
			.annotate(
				OpenApi.Description,
				"Adds a new crawl task to the dispatcher\n\n向调度器添加新的抓取任务"
			)
	)
	.add(
		HttpApiEndpoint.get("getTasks")`/tasks`
			.setUrlParams(QueryParams)
			.addSuccess(Schema.Array(Task.pipe(Schema.omit("data"))))
			.addError(TaskNotFoundError)

			.annotate(OpenApi.Summary, "List tasks")
			.annotate(
				OpenApi.Description,
				"Retrieves a list of tasks based on query filters\n\n根据查询过滤器检索任务列表"
			)
	)
	.add(
		HttpApiEndpoint.patch("updateTask")`/tasks/:id`
			.setPath(Schema.Struct({id: Schema.UUID}))
			.setPayload(UpdatePayload)
			.addSuccess(Task)
			.addError(TaskNotFoundError)

			.annotate(OpenApi.Summary, "Update a task")
			.annotate(
				OpenApi.Description,
				"Updates an existing task by its ID\n\n根据 ID 更新现有任务"
			)
	)
	.add(
		HttpApiEndpoint.del("deleteTask")`/tasks/:id`
			.setPath(Schema.Struct({id: Schema.UUID}))
			.addSuccess(Schema.Void)
			.addError(TaskNotFoundError)

			.annotate(OpenApi.Summary, "Delete a task")
			.annotate(
				OpenApi.Description,
				"Removes a task from the dispatcher by its ID\n\n根据 ID 从调度器中移除任务"
			)
	)
	.add(
		HttpApiEndpoint.post("nextTask")`/tasks/next`
			.setUrlParams(
				Schema.Struct({
					tags: Schema.String.pipe(Schema.Array).annotations({
						description:
							"Tags to match for the next task\n\n要匹配的下一个任务的标签"
					})
				})
			)
			.addSuccess(Task)
			.addError(TaskNotFoundError)

			.annotate(OpenApi.Summary, "Get next task")
			.annotate(
				OpenApi.Description,
				"Fetches the next available task matching the provided tags\n\n获取匹配提供标签的下一个可用任务"
			)
	)
	.add(
		HttpApiEndpoint.post("holdTask")`/tasks/hold/:id`
			.setPath(Schema.Struct({id: Schema.UUID}))
			.addSuccess(Schema.Void)
			.addError(TaskNotFoundError)

			.annotate(OpenApi.Summary, "Put task on hold")
			.annotate(
				OpenApi.Description,
				"Marks a task as being on hold, preventing it from being dispatched temporarily\n\n将任务标记为挂起状态，暂时防止其被调度"
			)
	)

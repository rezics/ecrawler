import {Task} from "@ecrawler/schemas/task"
import {HttpApiEndpoint, HttpApiGroup, OpenApi} from "@effect/platform"
import {Schema} from "effect"
import {UnknownError} from "@ecrawler/core/api/error.js"

export class TaskNotFoundError extends Schema.TaggedError<TaskNotFoundError>()("TaskNotFoundError", {}) {}

export const QueryParams = Schema.Struct({
	id: Schema.UUID.annotations({description: "Filter by task ID\n\n按任务 ID 筛选"}),
	by: Schema.UUID.annotations({description: "Filter by worker ID\n\n按工作节点 ID 筛选"}),
	tags: Schema.String.pipe(Schema.Array).annotations({
		description: "Filter by tags (all tags must match)\n\n按标签筛选（必须匹配所有标签）"
	}),
	since: Schema.Date.annotations({description: "Filter tasks created after this date\n\n筛选在此日期之后创建的任务"}),
	before: Schema.Date.annotations({
		description: "Filter tasks created before this date\n\n筛选在此日期之前创建的任务"
	}),
	link: Schema.BooleanFromString.annotations({
		description: "Whether to include full link in the response\n\n是否在响应中包含完整链接"
	}),
	limit: Schema.NumberFromString.annotations({
		description: "Maximum number of tasks to return\n\n返回任务的最大数量"
	}),
	offset: Schema.NumberFromString.annotations({description: "Number of tasks to skip\n\n要跳过的任务数量"})
})
	.annotations({
		identifier: "TaskQueryParams",
		description: "Query parameters for listing tasks\n\n列出任务的查询参数"
	})
	.pipe(Schema.partial)

export const CreatePayload = Schema.Struct({
	tags: Schema.String.pipe(Schema.Array).annotations({description: "Tags for the new task\n\n新任务的标签"}),
	link: Schema.String.annotations({description: "The task link\n\n任务链接"})
}).annotations({identifier: "CreateTaskPayload", description: "Payload for creating a new task\n\n创建新任务的载荷"})

export const UpdatePayload = Schema.Struct({
	tags: Schema.String.pipe(Schema.Array).annotations({description: "New tags for the task\n\n任务的新标签"}),
	link: Schema.String.annotations({description: "New link for the task\n\n任务的新链接"})
})
	.annotations({
		identifier: "UpdateTaskPayload",
		description: "Payload for updating an existing task\n\n更新现有任务的载荷"
	})
	.pipe(Schema.partial)

export const NextPayload = Schema.Struct({
	by: Schema.UUID.annotations({description: "Worker ID to assign the task to\n\n分配任务给的工作节点 ID"})
}).annotations({
	identifier: "NextTaskPayload",
	description: "Payload for getting the next task\n\n获取下一个任务的载荷"
})

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
			.annotate(OpenApi.Description, "Checks if the dispatcher service is healthy\n\n检查调度器服务是否健康")
	)
	.add(
		HttpApiEndpoint.post("createTask")`/tasks`
			.setPayload(CreatePayload)
			.addSuccess(Schema.Struct({id: Schema.UUID}))
			.annotate(OpenApi.Summary, "Create a new task")
			.annotate(OpenApi.Description, "Adds a new crawl task to the dispatcher\n\n向调度器添加新的抓取任务")
	)
	.add(
		HttpApiEndpoint.get("getTasks")`/tasks`
			.setUrlParams(QueryParams)
			.addSuccess(Schema.Array(Task))
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
			.annotate(OpenApi.Description, "Updates an existing task by its ID\n\n根据 ID 更新现有任务")
	)
	.add(
		HttpApiEndpoint.del("deleteTask")`/tasks/:id`
			.setPath(Schema.Struct({id: Schema.UUID}))
			.addSuccess(Schema.Void)
			.addError(TaskNotFoundError)
			.annotate(OpenApi.Summary, "Delete a task")
			.annotate(OpenApi.Description, "Removes a task from the dispatcher by its ID\n\n根据 ID 从调度器中移除任务")
	)
	.add(
		HttpApiEndpoint.post("nextTask")`/tasks/next`
			.setPayload(NextPayload)
			.setUrlParams(QueryParams.pipe(Schema.omit("limit")))
			.addSuccess(Task)
			.addError(TaskNotFoundError)
			.annotate(OpenApi.Summary, "Get next task")
			.annotate(
				OpenApi.Description,
				"Fetches the next oldest available task matching the provided query filters\n\n获取匹配提供查询过滤器的下一个最旧可用任务"
			)
	)

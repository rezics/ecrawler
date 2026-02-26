import {Schema} from "effect"
import * as Task from "@ecrawler/schemas/Task"

export class TaskNotFoundError extends Schema.TaggedError<TaskNotFoundError>()(
  "TaskNotFoundError",
  {}
) {}

export const QueryParams = Schema.Struct({
  id: Schema.UUID.annotations({
    description: "Filter by task ID\n\n按任务 ID 筛选"
  }),
  by: Schema.UUID.annotations({
    description: "Filter by worker ID\n\n按工作节点 ID 筛选"
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
  link: Schema.BooleanFromString.annotations({
    description:
      "Whether to include full link in the response\n\n是否在响应中包含完整链接"
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

export const CreatePayload = Schema.Struct({
  tags: Schema.String.pipe(Schema.Array).annotations({
    description: "Tags for the new task\n\n新任务的标签"
  }),
  link: Schema.String.annotations({description: "The task link\n\n任务链接"})
}).annotations({
  identifier: "CreateTaskPayload",
  description: "Payload for creating a new task\n\n创建新任务的载荷"
})

export const UpdatePayload = Schema.Struct({
  tags: Schema.String.pipe(Schema.Array).annotations({
    description: "New tags for the task\n\n任务的新标签"
  }),
  link: Schema.String.annotations({
    description: "New link for the task\n\n任务的新链接"
  })
})
  .annotations({
    identifier: "UpdateTaskPayload",
    description: "Payload for updating an existing task\n\n更新现有任务的载荷"
  })
  .pipe(Schema.partial)

export const NextPayload = Schema.Struct({
  by: Schema.UUID.annotations({
    description: "Worker ID to assign the task to\n\n分配任务给的工作节点 ID"
  })
}).annotations({
  identifier: "NextTaskPayload",
  description: "Payload for getting the next task\n\n获取下一个任务的载荷"
})

export const NextQueryParams = QueryParams.pipe(
  Schema.omit("limit"),
  Schema.extend(
    Schema.Struct({
      timeout: Schema.NumberFromString.annotations({
        description:
          "Long polling timeout in seconds. Server will wait up to this duration for a task to become available before returning 404.\n\n长轮询超时时间（秒）。服务器将等待最多此时长直到有任务可用，否则返回 404。"
      }).pipe(Schema.between(0, 30))
    }).pipe(Schema.partial)
  )
)

export const ApiInput = Task.Task
export type ApiInput = typeof Task.Task.Type

export const TaskApi = {
  ApiInput,
  TaskNotFoundError,
  QueryParams,
  CreatePayload,
  UpdatePayload,
  NextPayload,
  NextQueryParams
}

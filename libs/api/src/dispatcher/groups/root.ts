import {HttpApiEndpoint, HttpApiGroup, OpenApi} from "@effect/platform"
import {Schema} from "effect"
import {Auth} from "../../middlewares/Auth.ts"
import {UnknownError} from "../../error.ts"
import {TaskApi} from "../../schemas/Task.ts"
import {MaxBodySize} from "../../middlewares/MaxBodySize.ts"

const {
  TaskNotFoundError,
  QueryParams,
  CreatePayload,
  UpdatePayload,
  NextPayload,
  NextQueryParams,
  RenewLeasePayload
} = TaskApi

export default HttpApiGroup.make("dispatcher")
  .middleware(Auth)
  .middleware(MaxBodySize)
  .annotate(
    OpenApi.Description,
    "Operations related to task dispatching and queue management\n\n与任务调度和队列管理相关的操作"
  )
  .addError(UnknownError)
  .add(
    HttpApiEndpoint.post("createTask")`/tasks`
      .setPayload(CreatePayload)
      .addSuccess(Schema.OptionFromNullOr(Schema.Struct({id: Schema.UUID})))
      .annotate(OpenApi.Summary, "Create a new task")
      .annotate(
        OpenApi.Description,
        "Adds a new crawl task to the dispatcher. Returns the task ID if created, or null if the task already exists (same tags + link combination).\n\n向调度器添加新的抓取任务。如果创建成功返回任务 ID，如果任务已存在（相同的标签 + 链接组合）则返回 null。"
      )
  )
  .add(
    HttpApiEndpoint.get("getTasks")`/tasks`
      .setUrlParams(QueryParams)
      .addSuccess(Schema.Array(TaskApi.ApiInput))
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
      .addSuccess(TaskApi.ApiInput)
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
      .setPayload(NextPayload)
      .setUrlParams(NextQueryParams)
      .addSuccess(TaskApi.ApiInput)
      .addError(TaskNotFoundError)
      .annotate(OpenApi.Summary, "Get next task")
      .annotate(
        OpenApi.Description,
        "Fetches the next oldest available task matching the provided query filters.\n\n获取匹配提供查询过滤器的下一个最旧可用任务。"
      )
  )
  .add(
    HttpApiEndpoint.patch("renewLease")`/tasks/:id/renew`
      .setPath(Schema.Struct({id: Schema.UUID}))
      .setPayload(RenewLeasePayload)
      .addSuccess(Schema.Void)
      .addError(TaskNotFoundError)
      .annotate(OpenApi.Summary, "Renew task lease")
      .annotate(
        OpenApi.Description,
        "Renews the lease for a task currently being processed by a worker. Must be called periodically to prevent the task from being reclaimed.\n\n为 Worker 正在处理的任务续约。必须定期调用，否则任务将被回收并重新排队。"
      )
  )

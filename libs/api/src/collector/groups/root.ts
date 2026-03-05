import {Auth} from "../../middlewares/Auth.ts"
import {UnknownError} from "../../error.ts"
import {HttpApiEndpoint, HttpApiGroup, OpenApi} from "@effect/platform"
import {Schema} from "effect"
import {ResultApi} from "../../schemas/Result.ts"
import {MaxBodySize} from "../../middlewares/MaxBodySize.ts"

const {ResultNotFoundError, QueryParams, CreatePayload, UpdatePayload} =
  ResultApi

export default HttpApiGroup.make("collector")
  .middleware(Auth)
  .middleware(MaxBodySize)
  .annotate(
    OpenApi.Description,
    "Operations related to collecting and managing crawl results\n\n与收集和管理抓取结果相关的操作"
  )
  .addError(UnknownError)
  .add(
    HttpApiEndpoint.post("createResult")`/results`
      .setPayload(CreatePayload)
      .addSuccess(Schema.Struct({id: Schema.UUID}))
      .annotate(OpenApi.Summary, "Create a new result")
      .annotate(
        OpenApi.Description,
        "Submits a new crawl result to the collector\n\n向收集器提交新的抓取结果"
      )
  )
  .add(
    HttpApiEndpoint.get("getResults")`/results`
      .setUrlParams(QueryParams)
      .addSuccess(Schema.Array(ResultApi.ApiInputWithoutData))
      // .addError(ResultNotFoundError)
      .annotate(OpenApi.Summary, "List results")
      .annotate(
        OpenApi.Description,
        "Retrieves a list of results based on query filters\n\n根据查询过滤器检索结果列表"
      )
  )
  .add(
    HttpApiEndpoint.patch("updateResult")`/results/:id`
      .setPath(Schema.Struct({id: Schema.UUID}))
      .setPayload(UpdatePayload)
      .addSuccess(Schema.Void)
      .addError(ResultNotFoundError)
      .annotate(OpenApi.Summary, "Update a result")
      .annotate(
        OpenApi.Description,
        "Updates an existing result by its ID\n\n根据 ID 更新现有结果"
      )
  )
  .add(
    HttpApiEndpoint.del("deleteResult")`/results/:id`
      .setPath(Schema.Struct({id: Schema.UUID}))
      .addSuccess(Schema.Void)
      .addError(ResultNotFoundError)
      .annotate(OpenApi.Summary, "Delete a result")
      .annotate(
        OpenApi.Description,
        "Removes a result from the collector by its ID\n\n根据 ID 从收集器中移除结果"
      )
  )

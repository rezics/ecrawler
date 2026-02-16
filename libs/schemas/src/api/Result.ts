import {Schema} from "effect"
import * as Result from "../Result.ts"

export class ResultNotFoundError extends Schema.TaggedError<ResultNotFoundError>()(
  "ResultNotFoundError",
  {}
) {}

export const QueryParams = Schema.Struct({
  id: Schema.UUID.annotations({
    description: "Filter by result ID\n\n按结果 ID 筛选"
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
      "Filter results created after this date\n\n筛选在此日期之后创建的结果"
  }),
  before: Schema.Date.annotations({
    description:
      "Filter results created before this date\n\n筛选在此日期之前创建的结果"
  }),
  data: Schema.BooleanFromString.annotations({
    description:
      "Whether to include full data in the response\n\n是否在响应中包含完整数据"
  }),
  limit: Schema.NumberFromString.annotations({
    description: "Maximum number of results to return\n\n返回结果的最大数量"
  }),
  offset: Schema.NumberFromString.annotations({
    description: "Number of results to skip\n\n要跳过的结果数量"
  })
})
  .annotations({
    identifier: "ResultQueryParams",
    description: "Query parameters for listing results\n\n列出结果的查询参数"
  })
  .pipe(Schema.partial)

export const CreatePayload = Schema.Struct({
  by: Schema.UUID.annotations({
    description: "Worker ID that produced the result\n\n产生结果的工作节点 ID"
  }),
  tags: Schema.String.pipe(Schema.Array).annotations({
    description: "Tags for the new result\n\n新结果的标签"
  }),
  link: Schema.String.annotations({description: "The task link\n\n任务链接"}),
  data: Schema.Any.annotations({description: "The result data\n\n结果数据"})
}).annotations({
  identifier: "CreateResultPayload",
  description: "Payload for creating a new result\n\n创建新结果的载荷"
})

export const UpdatePayload = Schema.Struct({
  by: Schema.UUID.annotations({
    description: "Worker ID that produced the result\n\n产生结果的工作节点 ID"
  }),
  tags: Schema.String.pipe(Schema.Array).annotations({
    description: "New tags for the result\n\n结果的新标签"
  }),
  link: Schema.String.annotations({
    description: "New task link\n\n新的任务链接"
  }),
  data: Schema.Any.annotations({
    description: "New data for the result\n\n结果的新数据"
  })
})
  .annotations({
    identifier: "UpdateResultPayload",
    description: "Payload for updating an existing result\n\n更新现有结果的载荷"
  })
  .pipe(Schema.partial)

export const ApiInput = Result.Result
export type ApiInput = Result.Result

export const ApiInputWithoutData = Result.ApiInputWithoutData
export type ApiInputWithoutData = Result.ApiInputWithoutData

export const ResultApi = {
  ApiInput,
  ApiInputWithoutData,
  ResultNotFoundError,
  QueryParams,
  CreatePayload,
  UpdatePayload
}

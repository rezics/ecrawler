import {Schema} from "effect"
import * as Task from "./Task.ts"

export const Api = Schema.extend(
  Task.Task,
  Schema.Struct({
    by: Schema.UUID.annotations({
      description:
        "Identifier of the worker that produced this result\n\n产生此结果的工作节点的标识符"
    }),
    data: Schema.optional(Schema.Any).annotations({
      description: "The collected result data\n\n收集到的结果数据"
    })
  }).annotations({
    identifier: "Result",
    description: "Schema representing a crawl result\n\n表示抓取结果的模式"
  })
)
export type Api = typeof Api.Type

export const Result = Schema.Struct({
  tags: Schema.Array(Schema.String).annotations({
    description:
      "Tags associated with the extracted data\n\n与提取数据关联的标签"
  }),
  data: Schema.Any.annotations({
    description: "The extracted data\n\n提取的数据"
  })
})
export type Result = typeof Result.Type

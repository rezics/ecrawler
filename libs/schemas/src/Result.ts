import {Schema} from "effect"

export const Api = Schema.Struct({
  id: Schema.UUID.annotations({
    description: "Unique identifier for the result\n\n结果的唯一标识符"
  }),
  tags: Schema.String.pipe(Schema.Array).annotations({
    description:
      "Tags associated with the extracted data\n\n与提取数据关联的标签"
  }),
  link: Schema.String.annotations({description: "The task link\n\n任务链接"}),
  meta: Schema.optional(Schema.Unknown).annotations({
    description: "Arbitrary metadata\n\n任意元数据"
  }),
  data: Schema.Unknown.annotations({
    description: "The collected result data\n\n收集到的结果数据"
  }),
  created_at: Schema.Date.annotations({
    description: "Timestamp when the result was created\n\n结果创建的时间戳"
  }),
  updated_at: Schema.Date.annotations({
    description:
      "Timestamp when the result was last updated\n\n结果最后更新的时间戳"
  }),
  task_id: Schema.UUID.annotations({
    description: "ID of the task this result belongs to\n\n此结果所属任务的 ID"
  })
}).annotations({
  identifier: "Result",
  description: "Schema representing a crawl result\n\n表示抓取结果的模式"
})
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

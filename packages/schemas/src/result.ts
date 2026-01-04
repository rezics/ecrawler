import {Schema} from "effect"
import {Task} from "./task"

export const Result = Schema.extend(
	Task,
	Schema.Struct({
		worker_id: Schema.UUID.annotations({
			description:
				"Identifier of the worker that produced this result\n\n产生此结果的工作节点的标识符"
		}),
		data: Schema.optional(Schema.Any).annotations({
			description: "The collected result data\n\n收集到的结果数据"
		}),
		logs: Schema.Array(Schema.String)
			.annotations({
				description:
					"Execution logs from the worker\n\n来自工作节点的执行日志"
			})
			.pipe(
				Schema.optional,
				Schema.withDecodingDefault(() => [])
			)
	})
).annotations({
	identifier: "Result",
	description: "Schema representing a crawl result\n\n表示抓取结果的模式"
})

import {Auth} from "@ecrawler/core/api/auth.ts"
import {Result} from "@ecrawler/schemas/result"
import {HttpApiEndpoint, HttpApiGroup, OpenApi} from "@effect/platform"
import {Schema} from "effect"

export class ResultNotFoundError extends Schema.TaggedError<ResultNotFoundError>()("ResultNotFoundError", {}) {}

const QueryParams = Schema.Struct({
	id: Schema.UUID.annotations({description: "Filter by result ID\n\n按结果 ID 筛选"}),
	by: Schema.UUID.annotations({description: "Filter by worker ID\n\n按工作节点 ID 筛选"}),
	tags: Schema.String.pipe(Schema.Array).annotations({
		description: "Filter by tags (all tags must match)\n\n按标签筛选（必须匹配所有标签）"
	}),
	since: Schema.Date.annotations({
		description: "Filter results created after this date\n\n筛选在此日期之后创建的结果"
	}),
	before: Schema.Date.annotations({
		description: "Filter results created before this date\n\n筛选在此日期之前创建的结果"
	}),
	data: Schema.BooleanFromString.annotations({
		description: "Whether to include full data in the response\n\n是否在响应中包含完整数据"
	}),
	limit: Schema.NumberFromString.annotations({
		description: "Maximum number of results to return\n\n返回结果的最大数量"
	}),
	offset: Schema.NumberFromString.annotations({description: "Number of results to skip\n\n要跳过的结果数量"})
})
	.annotations({
		identifier: "ResultQueryParams",
		description: "Query parameters for listing results\n\n列出结果的查询参数"
	})
	.pipe(Schema.partial)

const CreatePayload = Schema.Struct({
	by: Schema.UUID.annotations({description: "Worker ID that produced the result\n\n产生结果的工作节点 ID"}),
	tags: Schema.String.pipe(Schema.Array).annotations({description: "Tags for the new result\n\n新结果的标签"}),
	link: Schema.String.annotations({description: "The task link\n\n任务链接"}),
	data: Schema.Any.annotations({description: "The result data\n\n结果数据"})
}).annotations({
	identifier: "CreateResultPayload",
	description: "Payload for creating a new result\n\n创建新结果的载荷"
})

const UpdatePayload = Schema.Struct({
	by: Schema.UUID.annotations({description: "Worker ID that produced the result\n\n产生结果的工作节点 ID"}),
	tags: Schema.String.pipe(Schema.Array).annotations({description: "New tags for the result\n\n结果的新标签"}),
	link: Schema.String.annotations({description: "New task link\n\n新的任务链接"}),
	data: Schema.Any.annotations({description: "New data for the result\n\n结果的新数据"})
})
	.annotations({
		identifier: "UpdateResultPayload",
		description: "Payload for updating an existing result\n\n更新现有结果的载荷"
	})
	.pipe(Schema.partial)

export default HttpApiGroup.make("collector")
	.middleware(Auth)
	.annotate(
		OpenApi.Description,
		"Operations related to collecting and managing crawl results\n\n与收集和管理抓取结果相关的操作"
	)
	.add(
		HttpApiEndpoint.post("createResult")`/results`
			.setPayload(CreatePayload)
			.addSuccess(Schema.Struct({id: Schema.UUID}))
			.annotate(OpenApi.Summary, "Create a new result")
			.annotate(OpenApi.Description, "Submits a new crawl result to the collector\n\n向收集器提交新的抓取结果")
	)
	.add(
		HttpApiEndpoint.get("getResults")`/results`
			.setUrlParams(QueryParams)
			.addSuccess(Schema.Array(Result.pipe(Schema.omit("data"))))
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
			.annotate(OpenApi.Description, "Updates an existing result by its ID\n\n根据 ID 更新现有结果")
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

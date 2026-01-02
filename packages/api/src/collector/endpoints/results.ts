import {HttpApiEndpoint, HttpApiGroup} from "@effect/platform"
import {Result, ResultError} from "@ecrawler/schemas"
import {Schema} from "effect"

export class ResultNotFoundError extends Schema.TaggedError<ResultNotFoundError>()(
	"ResultNotFoundError",
	{message: Schema.String}
) {}

export const SubmitSuccessPayload = Schema.Struct({
	taskId: Schema.UUID,
	data: Schema.Record({key: Schema.String, value: Schema.Unknown})
})

export const SubmitFailurePayload = Schema.Struct({
	taskId: Schema.UUID,
	error: ResultError
})

export const QueryParams = Schema.Struct({
	taskId: Schema.optional(Schema.String),
	status: Schema.optional(Schema.String),
	limit: Schema.optional(Schema.NumberFromString),
	offset: Schema.optional(Schema.NumberFromString)
})

export const ResultIdResponse = Schema.Struct({id: Schema.UUID})

export const ResultsApi = HttpApiGroup.make("Results")
	.add(
		HttpApiEndpoint.post("submitSuccess")`/success`
			.setPayload(SubmitSuccessPayload)
			.addSuccess(ResultIdResponse)
	)
	.add(
		HttpApiEndpoint.post("submitFailure")`/failure`
			.setPayload(SubmitFailurePayload)
			.addSuccess(ResultIdResponse)
	)
	.add(
		HttpApiEndpoint.get("list")`/`
			.setUrlParams(QueryParams)
			.addSuccess(Schema.Array(Result))
	)
	.add(
		HttpApiEndpoint.get("get")`/:id`
			.setPath(Schema.Struct({id: Schema.UUID}))
			.addSuccess(Result)
			.addError(ResultNotFoundError)
	)
	.add(
		HttpApiEndpoint.del("delete")`/:id`
			.setPath(Schema.Struct({id: Schema.UUID}))
			.addSuccess(Schema.Void)
			.addError(ResultNotFoundError)
	)

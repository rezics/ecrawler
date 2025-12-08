import {HttpApiEndpoint, HttpApiGroup} from "@effect/platform"
import Result from "../../../schemas/Result.ts"
import {Schema} from "effect"

export class ResultNotFoundError extends Schema.TaggedError<ResultNotFoundError>()(
	"ResultNotFoundError",
	{message: Schema.String}
) {}

const SubmitSuccessPayload = Schema.Struct({
	taskId: Schema.UUID,
	data: Schema.Object
})

const SubmitFailurePayload = Schema.Struct({
	taskId: Schema.UUID,
	error: Schema.Struct({type: Schema.String, message: Schema.String})
})

const QueryParams = Schema.Struct({
	taskId: Schema.String.pipe(Schema.optional),
	status: Schema.String.pipe(Schema.optional),
	limit: Schema.NumberFromString.pipe(Schema.optional),
	offset: Schema.NumberFromString.pipe(Schema.optional)
})

export default HttpApiGroup.make("Results")
	.add(
		HttpApiEndpoint.post("submitSuccess")`/success`
			.setPayload(SubmitSuccessPayload)
			.addSuccess(Result.pick("id"))
	)
	.add(
		HttpApiEndpoint.post("submitFailure")`/failure`
			.setPayload(SubmitFailurePayload)
			.addSuccess(Result.pick("id"))
	)
	.add(
		HttpApiEndpoint.get("list")`/`
			.setUrlParams(QueryParams)
			.addSuccess(Result.pipe(Schema.Array))
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

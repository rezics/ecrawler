import {Schema} from "effect"

export const ResultStatus = Schema.Literal("success", "failure")
export type ResultStatus = typeof ResultStatus.Type

const Result = Schema.Struct({
	id: Schema.UUID,
	taskId: Schema.UUID,
	workerId: Schema.UUID,
	status: ResultStatus,
	data: Schema.Object,
	error: Schema.optionalWith(
		Schema.Struct({type: Schema.String, message: Schema.String}),
		{as: "Option"}
	),
	collectedAt: Schema.DateTimeUtc
})

export default Result

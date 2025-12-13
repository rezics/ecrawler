import {Schema} from "effect"

export const ResultStatus = Schema.Literal("success", "failure")
export type ResultStatus = typeof ResultStatus.Type

export class ResultError extends Schema.Class<ResultError>("ResultError")({
	type: Schema.String,
	message: Schema.String
}) {}

export class Result extends Schema.Class<Result>("Result")({
	id: Schema.UUID,
	taskId: Schema.UUID,
	workerId: Schema.UUID,
	status: ResultStatus,
	data: Schema.Object,
	error: Schema.optionalWith(ResultError, {as: "Option"}),
	collectedAt: Schema.DateTimeUtc
}) {}

export default Result

import {Schema} from "effect"

export class Task extends Schema.Class<Task>("Task")({
	id: Schema.UUID,
	tags: Schema.Array(Schema.String),
	assignment: Schema.optionalWith(Schema.UUID, {as: "Option"}),
	assignedAt: Schema.optionalWith(Schema.DateTimeUtc, {as: "Option"}),
	payload: Schema.Record({key: Schema.String, value: Schema.Unknown})
}) {}

export type TaskType = typeof Task.Type

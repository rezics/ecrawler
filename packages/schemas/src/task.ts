import {Schema} from "effect"

export class Task extends Schema.Class<Task>("Task")({
	id: Schema.UUID,
	tags: Schema.Array(Schema.String),
	assignment: Schema.optionalWith(Schema.UUID, {as: "Option"}),
	payload: Schema.Object
}) {}

export type TaskType = typeof Task.Type

import {Schema} from "effect"

export class WorkerRegistration extends Schema.Class<WorkerRegistration>(
	"WorkerRegistration"
)({
	id: Schema.UUID,
	tags: Schema.Array(Schema.String),
	lastSeen: Schema.Date
}) {}

export type WorkerRegistrationType = typeof WorkerRegistration.Type

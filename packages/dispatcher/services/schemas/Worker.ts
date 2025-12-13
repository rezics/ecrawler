import {Schema} from "effect"
import {Task} from "./Task.ts"

const TaskWithoutAssignment = Task.pipe(Schema.omit("assignment"))

export class Worker extends Schema.Class<Worker>("Worker")({
	id: Schema.UUID,
	tasks: Schema.Array(TaskWithoutAssignment)
}) {}

export default Worker

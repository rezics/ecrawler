import {Schema} from "effect"
import Task from "./Task.ts"

const TaskWithoutAssignment = Task.pipe(Schema.omit("assignment"))

export default Schema.Struct({
	id: Schema.UUID,
	tasks: TaskWithoutAssignment.pipe(Schema.Array)
})

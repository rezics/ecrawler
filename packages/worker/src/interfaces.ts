import {Effect} from "effect"
import {Task} from "@ecrawler/schemas/task"

export interface Worker {
	readonly name: string
	readonly tags: readonly string[]
	readonly parser: Effect.Effect<
		(task: typeof Task.Type) => Effect.Effect<any[]>
	>
}

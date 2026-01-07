import {Effect} from "effect"
import {Task} from "@ecrawler/schemas/task"

export interface DataExtractor {
	readonly name: string
	readonly tags: readonly string[]
	readonly init: Effect.Effect<
		(task: typeof Task.Type) => Effect.Effect<any[]>
	>
}

export interface LinkExtractor {
	readonly name: string
	readonly tags: readonly string[]
	readonly init: Effect.Effect<
		(task: typeof Task.Type) => Effect.Effect<string[]>
	>
}

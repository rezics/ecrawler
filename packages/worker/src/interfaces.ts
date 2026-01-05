import {Effect} from "effect"
import {Task} from "@ecrawler/schemas/task"

export interface Worker<T = unknown> {
	readonly name: string
	readonly tags: readonly string[]
	readonly parser: Effect.Effect<
		(task: typeof Task.Type) => Effect.Effect<T[]>
	>
	readonly extractor?: Effect.Effect<
		(seed: string) => Effect.Effect<string[]>
	>
}

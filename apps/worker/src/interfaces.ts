import {Effect, Scope} from "effect"
import {Task} from "@ecrawler/schemas/task"

interface BaseExtractor<I, O> {
	readonly name: string
	readonly tags: readonly string[]
	readonly init: () => Effect.Effect<
		(i: I) => Effect.Effect<O[]>,
		never,
		Scope.Scope
	>
}

export type DataExtractor = BaseExtractor<typeof Task.Type, any> & {
	readonly role: "data"
}

export type LinkExtractor = BaseExtractor<typeof Task.Type, string> & {
	readonly role: "link"
}

export type Extractor = DataExtractor | LinkExtractor

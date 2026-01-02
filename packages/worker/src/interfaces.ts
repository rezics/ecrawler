import {Effect, Stream} from "effect"

export interface Worker {
	readonly tag: string
	readonly identifier: RegExp | ((url: string) => boolean)
	readonly transformer: (
		input: Stream.Stream<unknown>
	) => Stream.Stream<unknown>
}

export interface Proxy {
	readonly next: () => Effect.Effect<string>
}

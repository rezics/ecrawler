import {Effect, Stream} from "effect"

export interface WorkerShape {
	readonly tag: string
	readonly identifier: RegExp
	readonly transformer: (
		input: Stream.Stream<unknown>
	) => Stream.Stream<unknown>
}

export class Worker extends Effect.Tag("@ecrawler/worker/Worker")<
	Worker,
	WorkerShape
>() {}

export interface ProxyShape {
	/** request next proxy url */
	readonly next: () => Effect.Effect<string>
}

export class Proxy extends Effect.Tag("@ecrawler/worker/Proxy")<
	Proxy,
	ProxyShape
>() {}

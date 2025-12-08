import {Effect, Queue} from "effect"
import {type WorkerError} from "@ecrawler/worker-core"

export type DiscovererOptions = {readonly proxyUrl: string}

export type Discoverer = {
	readonly id: string
	readonly fn: (
		url: URL,
		options: DiscovererOptions
	) => Effect.Effect<Queue.Queue<URL>, WorkerError>
}

// Re-export worker errors for convenience
export {
	ProxyError,
	CaptchaError,
	RateLimitError,
	NotFoundError,
	InternalError,
	type WorkerError
} from "@ecrawler/worker-core"

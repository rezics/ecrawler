import {Effect} from "effect"
import {type WorkerError} from "@ecrawler/worker-core"

export type ScraperOptions = {readonly proxyUrl: string}

export type Scraper = {
	readonly id: string
	readonly fn: (
		url: URL,
		options: ScraperOptions
	) => Effect.Effect<unknown, WorkerError>
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

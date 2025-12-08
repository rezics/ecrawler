import {Config} from "effect"

// 共享的配置字段定义
export const WorkerIdConfig = Config.string("WORKER_ID")

export const DispatcherUrlConfig = Config.string("DISPATCHER_URL")

export const ProxyUrlConfig = Config.string("PROXY_URL").pipe(
	Config.withDefault("")
)

export const TagsConfig = Config.string("TAGS").pipe(
	Config.map(s =>
		s
			.split(",")
			.map(t => t.trim())
			.filter(t => t.length > 0)
	),
	Config.withDefault([])
)

export const MaxRetriesConfig = Config.number("MAX_RETRIES").pipe(
	Config.withDefault(3)
)

export const PollIntervalMsConfig = Config.number("POLL_INTERVAL_MS").pipe(
	Config.withDefault(5000)
)

// 基础配置类型
export type BaseWorkerConfig = {
	readonly workerId: string
	readonly dispatcherUrl: string
	readonly proxyUrl: string
	readonly tags: readonly string[]
	readonly maxRetries: number
	readonly pollIntervalMs: number
}

import {NodeRuntime, NodeHttpClient} from "@effect/platform-node"
import {Effect, Schedule, Duration, Layer} from "effect"

import ScraperConfig from "./services/configs/index.ts"
import {
	DispatcherClient,
	CollectorClient,
	ProxyClient,
	ProxyClientMock
} from "./services/clients/index.ts"
import {ScraperLoader} from "./services/loader.ts"
import {handleWorkerError} from "./services/errors.ts"
import type {WorkerError} from "./interfaces/index.ts"

const Main = Effect.gen(function* () {
	const config = yield* ScraperConfig
	const dispatcher = yield* DispatcherClient
	const collector = yield* CollectorClient
	const proxyClient = yield* ProxyClient
	const loader = yield* ScraperLoader

	yield* Effect.logInfo("Starting Scraper Worker...")
	yield* Effect.logInfo(`Worker ID: ${config.workerId}`)
	yield* Effect.logInfo(`Tags: ${config.tags.join(", ")}`)
	yield* Effect.logInfo(`Loaded scrapers: ${loader.getIds().join(", ")}`)

	// 主循环
	const loop = Effect.gen(function* () {
		// 从 dispatcher 获取下一个任务
		const task = yield* dispatcher.nextTask(config.tags)

		if (task === null) {
			yield* Effect.logDebug("No task available, waiting...")
			return
		}

		yield* Effect.logInfo(`Processing task: ${task.id}`)

		// 从 payload 中提取 scraper ID 和 URL
		const payload = task.payload as {scraperId?: string; url?: string}
		const scraperId = payload.scraperId
		const url = payload.url

		if (!scraperId || !url) {
			yield* Effect.logError(
				`Invalid task payload: missing scraperId or url`
			)
			// 提交失败结果
			yield* collector
				.submitFailure(task.id, {
					type: "InvalidPayload",
					message: "Task payload missing scraperId or url"
				})
				.pipe(
					Effect.tap(resultId =>
						Effect.logInfo(`Failure result submitted: ${resultId}`)
					),
					Effect.catchAll(e =>
						Effect.logError(
							`Failed to submit failure result: ${e.message}`
						)
					)
				)
			return
		}

		const scraper = loader.get(scraperId)
		if (!scraper) {
			yield* Effect.logError(`Scraper not found: ${scraperId}`)
			// 提交失败结果
			yield* collector
				.submitFailure(task.id, {
					type: "ScraperNotFound",
					message: `Scraper not found: ${scraperId}`
				})
				.pipe(
					Effect.tap(resultId =>
						Effect.logInfo(`Failure result submitted: ${resultId}`)
					),
					Effect.catchAll(e =>
						Effect.logError(
							`Failed to submit failure result: ${e.message}`
						)
					)
				)
			return
		}

		// 执行 scraper，支持重试
		let retryCount = 0
		let success = false
		let result: unknown = null
		let lastError: {type: string; message: string} | null = null
		let currentProxyUrl = yield* proxyClient
			.getProxy()
			.pipe(Effect.catchAll(() => Effect.succeed(config.proxyUrl)))

		while (!success && retryCount <= config.maxRetries) {
			const scraperResult = yield* scraper
				.fn(new URL(url), {proxyUrl: currentProxyUrl})
				.pipe(
					Effect.map(data => ({success: true as const, data})),
					Effect.catchAll((error: WorkerError) =>
						Effect.succeed({success: false as const, error})
					)
				)

			if (scraperResult.success) {
				success = true
				result = scraperResult.data
				yield* proxyClient.reportSuccess(currentProxyUrl)
				yield* Effect.logInfo(`Task ${task.id} completed successfully`)
			} else {
				const handling = handleWorkerError(
					scraperResult.error,
					retryCount,
					config.maxRetries
				)
				lastError = {
					type: scraperResult.error._tag,
					message: handling.message
				}
				yield* Effect.logWarning(
					`Task ${task.id} failed: ${handling.message}`
				)

				// 报告代理失败并获取新代理
				yield* proxyClient.reportFailure(currentProxyUrl)

				if (handling.shouldRetry) {
					retryCount++
					// 获取新代理用于重试
					currentProxyUrl = yield* proxyClient
						.getProxy()
						.pipe(
							Effect.catchAll(() =>
								Effect.succeed(config.proxyUrl)
							)
						)
					yield* Effect.logInfo(
						`Retrying task ${task.id} (${retryCount}/${config.maxRetries}) with new proxy`
					)
					yield* Effect.sleep(Duration.millis(handling.delayMs))
				} else {
					yield* Effect.logError(
						`Task ${task.id} failed permanently: ${handling.message}`
					)
					break
				}
			}
		}

		// 提交结果到 collector
		if (success && result !== null) {
			yield* collector.submitSuccess(task.id, result as object).pipe(
				Effect.tap(resultId =>
					Effect.logInfo(`Success result submitted: ${resultId}`)
				),
				Effect.catchAll(e =>
					Effect.logError(
						`Failed to submit success result: ${e.message}`
					)
				)
			)
		} else if (lastError !== null) {
			yield* collector.submitFailure(task.id, lastError).pipe(
				Effect.tap(resultId =>
					Effect.logInfo(`Failure result submitted: ${resultId}`)
				),
				Effect.catchAll(e =>
					Effect.logError(
						`Failed to submit failure result: ${e.message}`
					)
				)
			)
		}
	})

	// 持续循环处理任务
	return yield* loop.pipe(
		Effect.catchAll(e => Effect.logError(`Loop error: ${e}`)),
		Effect.repeat(Schedule.spaced(Duration.millis(config.pollIntervalMs))),
		Effect.forever
	)
})

const ConfigLive = ScraperConfig.Default

const ClientsLive = Layer.mergeAll(
	DispatcherClient.Default,
	CollectorClient.Default
).pipe(Layer.provide(ConfigLive), Layer.provide(NodeHttpClient.layerUndici))

const LoaderLive = ScraperLoader.Default
// for test use
const ProxyClientLive = ProxyClientMock

const MainLive = Layer.mergeAll(
	ConfigLive,
	ClientsLive,
	LoaderLive,
	ProxyClientLive
)

Main.pipe(Effect.provide(MainLive), NodeRuntime.runMain)

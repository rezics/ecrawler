import {NodeRuntime, NodeHttpClient} from "@effect/platform-node"
import {Effect, Schedule, Duration, Layer, Queue} from "effect"

import DiscovererConfig from "./services/configs/index.ts"
import {
	DispatcherClient,
	ProxyClient,
	ProxyClientMock
} from "./services/clients/index.ts"
import {DiscovererLoader} from "./services/loader.ts"
import {handleWorkerError} from "./services/errors.ts"
import type {WorkerError} from "./interfaces/index.ts"

const Main = Effect.gen(function* () {
	const config = yield* DiscovererConfig
	const dispatcher = yield* DispatcherClient
	const proxyClient = yield* ProxyClient
	const loader = yield* DiscovererLoader

	yield* Effect.logInfo("Starting Discoverer Worker...")
	yield* Effect.logInfo(`Worker ID: ${config.workerId}`)
	yield* Effect.logInfo(`Tags: ${config.tags.join(", ")}`)
	yield* Effect.logInfo(`Target Tags: ${config.targetTags.join(", ")}`)
	yield* Effect.logInfo(`Loaded discoverers: ${loader.getIds().join(", ")}`)

	// 主循环
	const loop = Effect.gen(function* () {
		// 从 dispatcher 获取下一个任务
		const task = yield* dispatcher.nextTask(config.tags)

		if (task === null) {
			yield* Effect.logDebug("No task available, waiting...")
			return
		}

		yield* Effect.logInfo(`Processing task: ${task.id}`)

		// 从 payload 中提取 discoverer ID 和 URL
		const payload = task.payload as {discovererId?: string; url?: string}
		const discovererId = payload.discovererId
		const url = payload.url

		if (!discovererId || !url) {
			yield* Effect.logError(
				`Invalid task payload: missing discovererId or url`
			)
			return
		}

		const discoverer = loader.get(discovererId)
		if (!discoverer) {
			yield* Effect.logError(`Discoverer not found: ${discovererId}`)
			return
		}

		// 执行 discoverer，支持重试
		let retryCount = 0
		let success = false
		let urlQueue: Queue.Queue<URL> | null = null
		let currentProxyUrl = yield* proxyClient
			.getProxy()
			.pipe(Effect.catchAll(() => Effect.succeed(config.proxyUrl)))

		while (!success && retryCount <= config.maxRetries) {
			const discovererResult = yield* discoverer
				.fn(new URL(url), {proxyUrl: currentProxyUrl})
				.pipe(
					Effect.map(queue => ({success: true as const, queue})),
					Effect.catchAll((error: WorkerError) =>
						Effect.succeed({success: false as const, error})
					)
				)

			if (discovererResult.success) {
				success = true
				urlQueue = discovererResult.queue
				yield* proxyClient.reportSuccess(currentProxyUrl)
				yield* Effect.logInfo(`Task ${task.id} completed successfully`)
			} else {
				const handling = handleWorkerError(
					discovererResult.error,
					retryCount,
					config.maxRetries
				)
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

		// 如果成功，从队列中取出所有 URL 并添加到 dispatcher
		if (success && urlQueue !== null) {
			let addedCount = 0
			let failedCount = 0

			// 从队列中取出所有 URL
			const drainUrls = Effect.gen(function* () {
				const urls: URL[] = []
				while (true) {
					const maybeUrl = yield* Queue.poll(urlQueue!)
					if (maybeUrl._tag === "None") break
					urls.push(maybeUrl.value)
				}
				return urls
			})

			const discoveredUrls = yield* drainUrls

			yield* Effect.logInfo(
				`Discovered ${discoveredUrls.length} URLs from task ${task.id}`
			)

			// 将发现的 URL 添加到 dispatcher
			for (const discoveredUrl of discoveredUrls) {
				const result = yield* dispatcher
					.addTask({tags: [...config.targetTags]})
					.pipe(
						Effect.map(() => true),
						Effect.catchAll(e =>
							Effect.logWarning(
								`Failed to add URL ${discoveredUrl.toString()}: ${e}`
							).pipe(Effect.map(() => false))
						)
					)

				if (result) {
					addedCount++
				} else {
					failedCount++
				}
			}

			yield* Effect.logInfo(
				`Added ${addedCount} URLs to dispatcher, ${failedCount} failed`
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

const ConfigLive = DiscovererConfig.Default

const ClientsLive = DispatcherClient.Default.pipe(
	Layer.provide(ConfigLive),
	Layer.provide(NodeHttpClient.layerUndici)
)

const LoaderLive = DiscovererLoader.Default
// for test use
const ProxyClientLive = ProxyClientMock

const MainLive = Layer.mergeAll(
	ConfigLive,
	ClientsLive,
	LoaderLive,
	ProxyClientLive
)

Main.pipe(Effect.provide(MainLive), NodeRuntime.runMain)

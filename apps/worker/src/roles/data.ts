import {Effect, pipe, Array} from "effect"
import {WorkerConfig} from "../config.ts"
import DispatcherClient from "../clients/dispatcher.ts"
import CollectorClient from "../clients/collector.ts"
import type {DataExtractor} from "../interfaces.ts"

export const initData = (worker: DataExtractor) =>
	Effect.gen(function* () {
		const config = yield* WorkerConfig
		const init = yield* Effect.cachedWithTTL(
			worker.init(),
			config.idleTimeout
		)

		return () =>
			Effect.gen(function* () {
				const {dispatcher} = yield* DispatcherClient
				const {collector} = yield* CollectorClient

				const tags = Array.append(worker.tags, "data")
				const task = yield* dispatcher.nextTask({
					payload: {by: config.id},
					urlParams: {tags, timeout: 30}
				})

				yield* pipe(
					init,
					Effect.flatMap(processor => processor(task)),
					Effect.map(
						Array.map(result =>
							collector.createResult({
								payload: {
									by: config.id,
									tags: task.tags,
									link: task.link,
									data: result
								}
							})
						)
					),
					Effect.flatMap(Effect.allWith({concurrency: "unbounded"})),
					Effect.asVoid
				)
			})
	})

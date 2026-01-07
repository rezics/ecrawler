import {Array, Effect, pipe, Queue, Layer} from "effect"
import CollectorClient from "./clients/collector"
import DispatcherClient from "./clients/dispatcher"
import {WorkerConfig} from "./config"
import type {DataExtractor} from "./interfaces"
import {NodeRuntime, NodeHttpClient} from "@effect/platform-node"
import {AdaptiveConcurrency} from "./acc"

const work = (worker: DataExtractor) =>
	Effect.gen(function* () {
		const config = yield* WorkerConfig
		const {dispatcher} = yield* DispatcherClient
		const {collector} = yield* CollectorClient

		const task = yield* dispatcher.nextTask({
			payload: {
				by: config.id
			},
			urlParams: {
				tags: worker.tags
			}
		})
		const transformer = yield* worker.init
		const results = yield* transformer(task)

		yield* pipe(
			results,
			Array.map(result =>
				collector.createResult({
					payload: {
						by: config.id,
						tags: task.tags,
						link: task.link,
						data: result
					}
				})
			),
			Effect.allWith({concurrency: "unbounded"}),
			Effect.asVoid
		)
	})

const program = Effect.gen(function* () {
	const config = yield* WorkerConfig
	const workers = yield* pipe(
		config.workers,
		Array.map(path => Effect.promise(() => import(path))),
		Effect.allWith({mode: "either", concurrency: "unbounded"}),
		Effect.map(Array.getRights),
		Effect.map(Array.map(module => module.default as DataExtractor))
	)

	yield* Effect.log(
		`Loaded ${workers.length} worker${workers.length === 1 ? "" : "s"}:`,
		Array.map(workers, worker => worker.name).join(" ")
	)

	const queue = yield* Queue.unbounded<DataExtractor>()
	yield* Queue.offerAll(queue, workers)

	yield* AdaptiveConcurrency.make(queue, work)
})

const MainLive = Layer.mergeAll(DispatcherClient.Default, CollectorClient.Default).pipe(
	Layer.provide(NodeHttpClient.layer)
)

program.pipe(Effect.provide(MainLive), NodeRuntime.runMain)

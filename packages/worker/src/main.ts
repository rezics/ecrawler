import {Array, Option, Effect, Either, pipe, Queue, Layer} from "effect"
import CollectorClient from "./clients/collector"
import DispatcherClient from "./clients/dispatcher"
import {WorkerConfig} from "./config"
import type {Worker} from "./interfaces"
import {NodeRuntime, NodeHttpClient} from "@effect/platform-node"
import {AdaptiveConcurrency} from "./acc"

const work = (worker: Worker) =>
	Effect.gen(function* () {
		const config = yield* WorkerConfig
		const {dispatcher} = yield* DispatcherClient
		const {collector} = yield* CollectorClient

		const task = yield* dispatcher.nextTask({
			urlParams: {
				by: config.id,
				tags: worker.tags
			}
		})
		const transformer = yield* worker.parser
		const results = yield* transformer(task)

		yield* pipe(
			results,
			Array.map(result =>
				collector.createResult({
					payload: {
						by: config.id,
						tags: task.tags,
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
		Effect.map(Array.map(Either.getRight)),
		Effect.map(Array.filter(Option.isSome)),
		Effect.map(Array.map(Option.getOrThrow)),
		Effect.map(Array.map(module => module.default as Worker))
	)

	yield* Effect.log(
		`Loaded ${workers.length} worker${workers.length === 1 ? "" : "s"}:`,
		Array.map(workers, worker => worker.name).join(" ")
	)

	const queue = yield* Queue.unbounded<Worker>()
	yield* Queue.offerAll(queue, workers)

	yield* AdaptiveConcurrency.make(queue, work)
})

const MainLive = Layer.mergeAll(
	DispatcherClient.Default,
	CollectorClient.Default
).pipe(Layer.provide(NodeHttpClient.layer))

program.pipe(Effect.provide(MainLive), NodeRuntime.runMain)

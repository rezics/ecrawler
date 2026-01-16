import {Effect, pipe, Array} from "effect"
import {WorkerConfig} from "../config"
import DispatcherClient from "../clients/dispatcher"
import CollectorClient from "../clients/collector"
import type {DataExtractor} from "../interfaces.ts"

export const initData = (worker: DataExtractor) =>
	Effect.gen(function* () {
		const processor = yield* worker.init

		// @effect-diagnostics-next-line returnEffectInGen:off
		return Effect.gen(function* () {
			const config = yield* WorkerConfig
			const {dispatcher} = yield* DispatcherClient
			const {collector} = yield* CollectorClient

			const tags = Array.append(worker.tags, "data")
			const task = yield* dispatcher.nextTask({payload: {by: config.id}, urlParams: {tags, timeout: 30}})

			yield* pipe(
				yield* processor(task),
				Array.map(result =>
					collector.createResult({payload: {by: config.id, tags: task.tags, link: task.link, data: result}})
				),
				Effect.allWith({concurrency: "unbounded"}),
				Effect.asVoid
			)
		})
	})

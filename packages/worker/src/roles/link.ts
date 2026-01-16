import {Effect, pipe, Array} from "effect"
import {WorkerConfig} from "../config"
import DispatcherClient from "../clients/dispatcher"
import type {LinkExtractor} from "../interfaces.ts"

export const initLink = (worker: LinkExtractor) =>
	Effect.gen(function* () {
		const processor = yield* worker.init

		// @effect-diagnostics-next-line returnEffectInGen:off
		return Effect.gen(function* () {
			const config = yield* WorkerConfig
			const {dispatcher} = yield* DispatcherClient

			const tags = Array.append(worker.tags, "link")
			const task = yield* dispatcher.nextTask({payload: {by: config.id}, urlParams: {tags, timeout: 30}})

			yield* pipe(
				yield* processor(task),
				Array.map(result =>
					dispatcher.createTask({payload: {link: result, tags: Array.append(task.tags, "data")}})
				),
				Effect.allWith({concurrency: "unbounded"}),
				Effect.asVoid
			)
		})
	})

import {Array, Chunk, Duration, Effect, Layer, pipe, Stream} from "effect"
import {NodeRuntime} from "@effect/platform-node"
import {NodeHttpClient} from "@effect/platform-node"
import {WorkerConfig} from "./services/configs"
import {Worker, type WorkerShape} from "./interfaces"
import {dispatcherClient} from "./services/dispatcher"
import {collectorClient} from "./services/collector"

const program = Effect.gen(function* () {
	const config = yield* WorkerConfig
	const dispatcher = yield* dispatcherClient
	const collector = yield* collectorClient

	const workers = yield* pipe(
		config.layers,
		Array.map(url => () => import(url.toString())),
		Array.map(Effect.promise),
		Effect.all,
		Effect.map(Array.map(i => i.default as Layer.Layer<Worker>))
	)

	const workerServices: WorkerShape[] = yield* pipe(
		workers,
		Array.map(layer => Effect.provide(Worker, layer)),
		Effect.all
	)

	const tags = workerServices.map(w => w.tag)

	const processLoop = Effect.gen(function* () {
		const task = yield* dispatcher.Tasks["next-task"]({payload: {tags}})

		const matchedWorker = workerServices.find(w =>
			w.identifier.test(JSON.stringify(task.payload))
		)

		if (!matchedWorker) {
			yield* collector.Results.submitFailure({
				payload: {
					taskId: task.id,
					error: {
						type: "WorkerNotFound",
						message: `No worker found for task ${task.id}`
					}
				}
			})
			return
		}

		const result = yield* pipe(
			Stream.make(task.payload),
			matchedWorker.transformer,
			Stream.runCollect,
			Effect.map(Chunk.toReadonlyArray),
			Effect.map(items => ({items})),
			Effect.catchAllCause(cause =>
				Effect.succeed({
					error: {
						type: "ProcessingError",
						message: cause.toString()
					}
				})
			)
		)

		if ("error" in result) {
			yield* collector.Results.submitFailure({
				payload: {
					taskId: task.id,
					error: result.error
				}
			})
		} else {
			yield* collector.Results.submitSuccess({
				payload: {
					taskId: task.id,
					data: {items: result}
				}
			})
		}
	}).pipe(
		Effect.catchTag("TaskNotFoundError", () =>
			Effect.sleep(Duration.seconds(5))
		),
		Effect.catchAll(error => Effect.logError(`Worker error: ${error}`))
	)

	return yield* Effect.forever(processLoop)
}).pipe(Effect.scoped)

const MainLive = Layer.mergeAll(WorkerConfig.Default, NodeHttpClient.layer)

program.pipe(
	Effect.provide(MainLive),
	Effect.tapErrorCause(Effect.logError),
	NodeRuntime.runMain
)

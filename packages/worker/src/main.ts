import {
	Array,
	Chunk,
	Duration,
	Effect,
	Layer,
	Option,
	pipe,
	Stream
} from "effect"
import {NodeRuntime} from "@effect/platform-node"
import {NodeHttpClient} from "@effect/platform-node"
import {WorkerConfig} from "./config.ts"
import {Worker, type WorkerShape} from "./interfaces.ts"
import {dispatcherClient, collectorClient} from "./clients/index.ts"

const loadWorkers = (layers: readonly URL[]) =>
	pipe(
		layers,
		Array.map(url => Effect.promise(() => import(url.toString()))),
		Effect.all,
		Effect.map(Array.map(i => i.default as Layer.Layer<Worker>)),
		Effect.flatMap(workers =>
			pipe(
				workers,
				Array.map(layer => Effect.provide(Worker, layer)),
				Effect.all
			)
		)
	)

const findWorker = (workers: readonly WorkerShape[], payload: unknown) =>
	Array.findFirst(workers, w => w.identifier.test(JSON.stringify(payload)))

const processTask =
	(workers: readonly WorkerShape[]) =>
	(task: {id: string; payload: unknown}) =>
		pipe(
			findWorker(workers, task.payload),
			Option.match({
				onNone: () =>
					Effect.succeed({
						taskId: task.id,
						result: Option.none<readonly unknown[]>(),
						error: Option.some({
							type: "WorkerNotFound",
							message: `No worker found for task ${task.id}`
						})
					}),
				onSome: worker =>
					pipe(
						Stream.make(task.payload),
						worker.transformer,
						Stream.runCollect,
						Effect.map(Chunk.toReadonlyArray),
						Effect.matchEffect({
							onSuccess: items =>
								Effect.succeed({
									taskId: task.id,
									result: Option.some(items),
									error: Option.none<{
										type: string
										message: string
									}>()
								}),
							onFailure: cause =>
								Effect.succeed({
									taskId: task.id,
									result: Option.none<readonly unknown[]>(),
									error: Option.some({
										type: "ProcessingError",
										message: String(cause)
									})
								})
						})
					)
			})
		)

const submitResult =
	(collector: Effect.Effect.Success<typeof collectorClient>) =>
	(result: {
		taskId: string
		result: Option.Option<readonly unknown[]>
		error: Option.Option<{type: string; message: string}>
	}) =>
		Option.match(result.error, {
			onSome: error =>
				collector.Results.submitFailure({
					payload: {taskId: result.taskId, error}
				}),
			onNone: () =>
				collector.Results.submitSuccess({
					payload: {
						taskId: result.taskId,
						data: {items: Option.getOrElse(result.result, () => [])}
					}
				})
		})

const program = pipe(
	Effect.all({
		config: WorkerConfig,
		dispatcher: dispatcherClient,
		collector: collectorClient
	}),
	Effect.flatMap(({config, dispatcher, collector}) =>
		pipe(
			loadWorkers(config.layers),
			Effect.map(workers => ({
				workers,
				tags: Array.map(workers, w => w.tag),
				dispatcher,
				collector
			}))
		)
	),
	Effect.flatMap(({workers, tags, dispatcher, collector}) =>
		pipe(
			dispatcher.Tasks["next-task"]({payload: {tags}}),
			Effect.flatMap(processTask(workers)),
			Effect.flatMap(submitResult(collector)),
			Effect.catchTag("TaskNotFoundError", () =>
				Effect.sleep(Duration.seconds(5))
			),
			Effect.catchAll(error => Effect.logError(`Worker error: ${error}`)),
			Effect.forever
		)
	),
	Effect.scoped
)

const MainLive = Layer.mergeAll(WorkerConfig.Default, NodeHttpClient.layer)

program.pipe(
	Effect.provide(MainLive),
	Effect.tapErrorCause(Effect.logError),
	NodeRuntime.runMain
)

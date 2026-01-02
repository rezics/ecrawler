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
import type {Worker} from "./interfaces.ts"
import {dispatcherClient, collectorClient} from "./clients/index.ts"

const loadWorkers = (layers: readonly URL[]) =>
	pipe(
		layers,
		Array.map(url => Effect.promise(() => import(url.toString()))),
		Effect.all,
		Effect.map(Array.map(i => i.default as Worker))
	)

const matchIdentifier = (identifier: Worker["identifier"], value: string) =>
	typeof identifier === "function"
		? identifier(value)
		: identifier.test(value)

const findWorker = (workers: readonly Worker[], payload: unknown) =>
	Array.findFirst(workers, w =>
		matchIdentifier(w.identifier, JSON.stringify(payload))
	)

const processTask =
	(workers: readonly Worker[]) => (task: {id: string; payload: unknown}) =>
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
	(
		collector: Effect.Effect.Success<typeof collectorClient>,
		dispatcher: Effect.Effect.Success<typeof dispatcherClient>
	) =>
	(result: {
		taskId: string
		result: Option.Option<readonly unknown[]>
		error: Option.Option<{type: string; message: string}>
	}) =>
		pipe(
			Option.match(result.error, {
				onSome: error =>
					collector.Results.submitFailure({
						payload: {taskId: result.taskId, error}
					}),
				onNone: () =>
					collector.Results.submitSuccess({
						payload: {
							taskId: result.taskId,
							data: {
								items: Option.getOrElse(result.result, () => [])
							}
						}
					})
			}),
			Effect.flatMap(() =>
				dispatcher.Tasks["complete-task"]({
					payload: {id: result.taskId}
				})
			)
		)

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
			Effect.flatMap(submitResult(collector, dispatcher)),
			Effect.catchTag("TaskNotFoundError", () =>
				Effect.sleep(Duration.seconds(5))
			),
			Effect.catchTag("AuthError", error =>
				Effect.logError(`Authentication error: ${error.message}`).pipe(
					Effect.andThen(Effect.fail(error))
				)
			),
			Effect.catchTag("DatabaseError", error =>
				Effect.logWarning(
					`Database error (retrying): ${error.message}`
				).pipe(Effect.andThen(Effect.sleep(Duration.seconds(10))))
			),
			Effect.catchAll(error => {
				const errorMessage = String(error)
				// Network errors are recoverable
				if (
					errorMessage.includes("ECONNREFUSED") ||
					errorMessage.includes("ETIMEDOUT") ||
					errorMessage.includes("fetch failed")
				) {
					return Effect.logWarning(
						`Network error (retrying): ${errorMessage}`
					).pipe(Effect.andThen(Effect.sleep(Duration.seconds(5))))
				}
				// Log other errors but continue
				return Effect.logError(`Unexpected error: ${errorMessage}`)
			}),
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

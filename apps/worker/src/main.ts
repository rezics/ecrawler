import "dotenv/config"
import {Array, Effect, pipe, Layer, Match, Ref, Duration, Stream, Schedule, Chunk, Either} from "effect"
import CollectorClient from "./clients/collector.ts"
import DispatcherClient from "./clients/dispatcher.ts"
import {WorkerConfig} from "./config.ts"
import type {Extractor} from "./interfaces.ts"
import {NodeRuntime, NodeHttpClient} from "@effect/platform-node"
import {initData} from "./roles/data.ts"
import {initLink} from "./roles/link.ts"

const init = (worker: Extractor) =>
	Match.value(worker).pipe(
		Match.when({role: "data"}, initData),
		Match.when({role: "link"}, initLink),
		Match.exhaustive
	)

const program = Effect.gen(function* () {
	const config = yield* WorkerConfig
	const [errors, workers] = yield* pipe(
		config.workers,
		Effect.partition(path => Effect.tryPromise(() => import(path)).pipe(Effect.mapError(() => path)), {
			concurrency: "unbounded"
		}),
		Effect.map(([errors, workers]) => [errors, Array.map(workers, module => module.default as Extractor)] as const)
	)

	if (Array.length(errors) > 0) {
		yield* Effect.logWarning(
			`Failed to load ${Array.length(errors)} worker${Array.length(errors) === 1 ? "" : "s"}:`,
			errors
		)
	}

	yield* Effect.log(
		`Loaded ${workers.length} worker${workers.length === 1 ? "" : "s"}:`,
		Array.map(workers, worker => worker.name)
	)

	const processors = yield* pipe(workers, Array.map(init), Effect.allWith({concurrency: "unbounded"}))

	const window = Array.length(processors)
	const limit = yield* Ref.make(1)
	const cap = yield* Ref.make(config.capacity)
	const alpha = yield* Ref.make(0.3)
	const slack = yield* Ref.make(1.5)
	const ema = yield* Ref.make(Duration.zero)
	const min = yield* Ref.make(Duration.infinity)

	const up = () =>
		cap.pipe(
			Effect.flatMap(max => Ref.updateAndGet(limit, n => Math.min(n + 1, max))),
			Effect.tap(n => gate.resize(n))
		)
	const down = () => Ref.updateAndGet(limit, n => Math.max(n / 2, 1)).pipe(Effect.tap(n => gate.resize(n)))

	const gate = yield* limit.pipe(Effect.flatMap(n => Effect.makeSemaphore(n)))
	const stream = Stream.repeat(Stream.fromIterable(processors), Schedule.forever)
	const stats = yield* Ref.make(Chunk.empty<Duration.Duration>())

	yield* Effect.repeat(
		Effect.gen(function* () {
			yield* down()
			yield* Ref.set(min, yield* ema)
		}),
		Schedule.spaced(Duration.minutes(5))
	).pipe(Effect.fork)

	return yield* Stream.runForEach(stream, task =>
		gate.withPermits(1)(
			task().pipe(
				Effect.asVoid,
				Effect.either,
				Effect.timed,
				Effect.flatMap(([duration, result]) =>
					Effect.gen(function* () {
						if (Either.isLeft(result)) return yield* down()

						yield* Ref.update(stats, s =>
							Chunk.append(Chunk.size(s) < window ? s : Chunk.drop(s, 1), duration)
						)

						const samples = yield* stats
						if (Chunk.size(samples) < window) return

						const avg = yield* Duration.divide(Chunk.reduce(samples, Duration.zero, Duration.sum), window)

						const gain = yield* alpha
						const next = Duration.decode(
							gain * Duration.toMillis(avg) + (1 - gain) * Duration.toMillis(yield* ema)
						)

						yield* Ref.set(ema, next)
						if (Duration.lessThan(next, yield* min)) yield* Ref.set(min, next)

						if (Duration.lessThan(next, Duration.times(yield* min, yield* slack))) {
							return yield* up()
						} else {
							return yield* down()
						}
					})
				)
			)
		)
	)
})

const MainLive = Layer.mergeAll(DispatcherClient.Default, CollectorClient.Default).pipe(
	Layer.provide(NodeHttpClient.layer)
)

program.pipe(Effect.scoped, Effect.provide(MainLive), NodeRuntime.runMain)

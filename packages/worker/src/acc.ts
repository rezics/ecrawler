import {Effect, pipe, Queue, Ref, Chunk, Array, Duration, Option} from "effect"

/**
 * AIMD-based adaptive concurrency control with EMA latency smoothing.
 *
 * 基于 AIMD 的自适应并发控制，使用 EMA 平滑延迟。
 */
export namespace AdaptiveConcurrency {
	export interface Options {
		/** EMA smoothing factor (0-1). Higher = more weight on recent. */
		readonly alpha?: number

		/** Allowed latency increase ratio before backoff. 0.1 = 10% tolerance. */
		readonly tolerance?: number

		/** @default 1 */
		readonly initialConcurrency?: number

		/** @default 1 */
		readonly minConcurrency?: number

		/** @default Infinity */
		readonly maxConcurrency?: number
	}

	/**
	 * Processes tasks from queue with adaptive concurrency.
	 * - Increase: +1 when latency within tolerance
	 * - Decrease: halved on latency spike or failure
	 *
	 * 从队列消费任务，自适应调整并发数。
	 * - 增加：延迟在容忍范围内时 +1
	 * - 减少：延迟超标或失败时减半
	 */
	export const make = <T, E, R>(
		queue: Queue.Queue<T>,
		fn: (task: T) => Effect.Effect<void, E, R>,
		options?: Options
	): Effect.Effect<void, E, R> => {
		const clamp = (c: number) =>
			Math.min(Math.max(c, minConcurrency), maxConcurrency)

		const alpha = options?.alpha ?? 0.3
		const tolerance = options?.tolerance ?? 0.1

		const minConcurrency = Math.max(1, options?.minConcurrency ?? 1)
		const maxConcurrency = options?.maxConcurrency ?? Infinity

		const increase = (c: number) => clamp(c + 1)
		const decrease = (c: number) => clamp(Math.floor(c / 2))

		return Effect.gen(function* () {
			const concurrencyRef = yield* Ref.make(
				clamp(options?.initialConcurrency ?? 1)
			)
			const emaRef = yield* Ref.make(Option.none<number>())

			return yield* Effect.gen(function* () {
				const results = yield* pipe(
					yield* Queue.takeBetween(
						queue,
						1,
						yield* Ref.get(concurrencyRef)
					),
					Chunk.map(task =>
						pipe(
							fn(task),
							Effect.timed,
							Effect.map(([d]) =>
								Option.some(Duration.toMillis(d))
							),
							Effect.catchAll(() =>
								Effect.succeed(Option.none<number>())
							)
						)
					),
					Effect.allWith({concurrency: "unbounded"})
				)

				const latencies = Array.filterMap(results, r => r)
				const includeFailures = latencies.length < results.length

				if (latencies.length === 0) {
					yield* Ref.update(concurrencyRef, decrease)
					return
				}

				const currentLatency =
					Array.reduce(latencies, 0, (sum, v) => sum + v) /
					latencies.length

				yield* Option.match(yield* Ref.get(emaRef), {
					onNone: () =>
						Effect.gen(function* () {
							yield* Ref.set(emaRef, Option.some(currentLatency))
							if (!includeFailures)
								yield* Ref.update(concurrencyRef, increase)
						}),
					onSome: prev =>
						Effect.gen(function* () {
							yield* Ref.set(
								emaRef,
								Option.some(
									alpha * currentLatency + (1 - alpha) * prev
								)
							)

							if (includeFailures) {
								yield* Ref.update(concurrencyRef, decrease)
							} else {
								yield* Ref.update(
									concurrencyRef,
									currentLatency <= prev * (1 + tolerance)
										? increase
										: decrease
								)
							}
						})
				})
			}).pipe(Effect.forever)
		})
	}
}

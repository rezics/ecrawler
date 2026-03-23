import {Chunk, Effect, Fiber, Queue, Ref, Tuple} from "effect"
import {Extractor} from "./services/Extractor.ts"
import {Scaler} from "./services/Scaler.ts"
import {Client} from "./services/Client.ts"

export const program = Effect.gen(function* () {
  const {queue, submit, renewLease} = yield* Client
  const {init, next} = yield* Scaler
  const extract = yield* Extractor

  const concurrency = yield* init.pipe(Effect.flatMap(Ref.make))
  while (true) {
    const _concurrency = yield* concurrency

    const results = yield* Queue.takeUpTo(queue, _concurrency).pipe(
      Effect.map(
        Chunk.map(task =>
          Effect.gen(function* () {
            const fiber = yield* renewLease(task.id).pipe(Effect.fork)
            const result = yield* extract.extract(task).pipe(
              Effect.timed,
              Effect.tap(([duration, result]) =>
                next({task, result, duration}).pipe(
                  Effect.flatMap(target => Ref.set(concurrency, target))
                )
              ),
              Effect.map(Tuple.getSecond)
            )
            yield* Fiber.interrupt(fiber)
            return result
          })
        )
      ),
      Effect.flatMap(Effect.allWith({concurrency: "unbounded"})),
      Effect.map(Chunk.fromIterable)
    )

    yield* results.pipe(
      Chunk.map(result => submit(result)),
      Effect.allWith({concurrency: "unbounded"})
    )
  }
})

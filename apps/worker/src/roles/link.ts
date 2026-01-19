import {Effect, pipe, Array} from "effect"
import {WorkerConfig} from "../config.ts"
import DispatcherClient from "../clients/dispatcher.ts"
import type {LinkExtractor} from "../interfaces.ts"

export const initLink = (worker: LinkExtractor) =>
  Effect.gen(function* () {
    const config = yield* WorkerConfig
    const init = yield* Effect.cachedWithTTL(worker.init(), config.idleTimeout)

    return () =>
      Effect.gen(function* () {
        const {dispatcher} = yield* DispatcherClient

        const tags = Array.append(worker.tags, "link")
        const task = yield* dispatcher.nextTask({
          payload: {by: config.id},
          urlParams: {tags, timeout: 30}
        })

        yield* pipe(
          init,
          Effect.flatMap(processor => processor(task)),
          Effect.map(
            Array.map(result =>
              dispatcher.createTask({
                payload: {link: result, tags: Array.append(task.tags, "data")}
              })
            )
          ),
          Effect.flatMap(Effect.allWith({concurrency: "unbounded"})),
          Effect.asVoid
        )
      })
  })

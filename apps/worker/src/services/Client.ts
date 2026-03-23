import {Effect, Iterable, Layer, Queue, Schedule} from "effect"
import {Task} from "@ecrawler/schemas"
import {WorkerConfig} from "./WorkerConfig"
import {HttpApiClient, HttpClient, HttpClientRequest} from "@effect/platform"
import DispatcherApi from "@ecrawler/api/dispatcher/index.ts"
import CollectorApi from "@ecrawler/api/collector/index.ts"
import type {ExtractorResult} from "./Extractor"

export class Client extends Effect.Tag("Client")<
  Client,
  {
    readonly queue: Queue.Queue<Task.Task>
    readonly submit: (
      input: ExtractorResult
    ) => Effect.Effect<void, never, never>
    readonly renewLease: (taskId: string) => Effect.Effect<void, never, never>
  }
>() {
  static readonly Default = Layer.scoped(
    Client,
    Effect.gen(function* () {
      const config = yield* WorkerConfig
      const httpClient = yield* HttpClient.HttpClient.pipe(
        Effect.map(
          HttpClient.mapRequest(
            HttpClientRequest.setHeader(
              "Authorization",
              `Bearer ${config.secretKey}`
            )
          )
        )
      )

      const dispatcherClient = yield* HttpApiClient.makeWith(DispatcherApi, {
        httpClient,
        baseUrl: config.baseUrl
      })

      const collectorClient = yield* HttpApiClient.makeWith(CollectorApi, {
        httpClient,
        baseUrl: config.baseUrl
      })

      const taskQueue = yield* Queue.unbounded<Task.Task>()

      const pollTimeout = config.pollTimeout
      const tags = config.tags
      const workerId = config.id

      yield* Effect.gen(function* () {
        const task = yield* dispatcherClient.dispatcher.nextTask({
          payload: {workerId},
          urlParams: {tags, timeout: pollTimeout}
        })
        yield* Queue.offer(taskQueue, task)
      }).pipe(
        Effect.retry(
          Schedule.exponential("1 seconds").pipe(Schedule.upTo("1 minutes"))
        ),
        Effect.forever,
        Effect.forkScoped
      )

      return Client.of({
        queue: taskQueue,
        renewLease: taskId =>
          Effect.schedule(
            dispatcherClient.dispatcher
              .renewLease({
                path: {id: taskId},
                payload: {workerId}
              })
              .pipe(Effect.ignore),
            Schedule.spaced(config.renewInterval)
          ),
        submit: result =>
          Effect.gen(function* () {
            const firstLink = yield* Iterable.head(result.links)

            yield* Effect.all(
              Iterable.map(result.records, data =>
                collectorClient.collector.createResult({
                  payload: {tags, link: firstLink.toString(), data}
                })
              ),
              {concurrency: "unbounded"}
            ).pipe(Effect.asVoid)

            yield* Effect.all(
              Iterable.map(result.links, link =>
                dispatcherClient.dispatcher.createTask({
                  payload: {link: link.toString(), tags}
                })
              ),
              {concurrency: "unbounded"}
            ).pipe(Effect.asVoid)
          }).pipe(Effect.catchAll(() => Effect.void))
      })
    })
  )
}

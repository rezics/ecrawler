import DispatcherApi from "@ecrawler/api/dispatcher/index.ts"
import {Effect, Redacted} from "effect"
import {WorkerConfig} from "../config.ts"
import {HttpClient, HttpClientRequest} from "@effect/platform"
import {HttpApiClient} from "@effect/platform"

export default class DispatcherClient extends Effect.Service<DispatcherClient>()(
  "@ecrawler/worker/DispatcherClient",
  {
    effect: Effect.gen(function* () {
      const config = yield* WorkerConfig
      const httpClient = yield* HttpClient.HttpClient.pipe(
        Effect.map(
          HttpClient.mapRequest(
            HttpClientRequest.setHeader(
              "Authorization",
              `Bearer ${Redacted.value(config.dispatcher.token)}`
            )
          )
        )
      )
      return yield* HttpApiClient.makeWith(DispatcherApi, {
        httpClient,
        baseUrl: config.dispatcher.url
      })
    }),
    accessors: true
  }
) {}

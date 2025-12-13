import {DispatcherApi} from "@ecrawler/dispatcher/api"
import {Effect} from "effect"
import {WorkerConfig} from "../configs"
import {HttpClient} from "@effect/platform/HttpClient"
import {HttpApiClient} from "@effect/platform"

export const dispatcherClient = Effect.gen(function* () {
	const config = yield* WorkerConfig
	const http = yield* HttpClient

	return yield* HttpApiClient.makeWith(DispatcherApi, {
		httpClient: http,
		baseUrl: config.dispatcher.url
	})
})

export default dispatcherClient

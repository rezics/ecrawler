import {DispatcherApi} from "@ecrawler/api/dispatcher"
import {Effect} from "effect"
import {WorkerConfig} from "../config.ts"
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

import {CollectorApi} from "@ecrawler/api/collector"
import {Effect} from "effect"
import {HttpClient} from "@effect/platform/HttpClient"
import {HttpApiClient} from "@effect/platform"
import {WorkerConfig} from "../config.ts"

export const collectorClient = Effect.gen(function* () {
	const config = yield* WorkerConfig
	const http = yield* HttpClient
	return yield* HttpApiClient.makeWith(CollectorApi, {
		httpClient: http,
		baseUrl: config.collector.url
	})
})

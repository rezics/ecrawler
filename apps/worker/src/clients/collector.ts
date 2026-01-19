import CollectorApi from "@ecrawler/api/collector/index.ts"
import {Effect, Redacted} from "effect"
import {HttpClient, HttpClientRequest} from "@effect/platform"
import {HttpApiClient} from "@effect/platform"
import {WorkerConfig} from "../config.ts"

export default class CollectorClient extends Effect.Service<CollectorClient>()("@ecrawler/worker/CollectorClient", {
	effect: Effect.gen(function* () {
		const config = yield* WorkerConfig
		const httpClient = yield* HttpClient.HttpClient.pipe(
			Effect.map(
				HttpClient.mapRequest(
					HttpClientRequest.setHeader("Authorization", `Bearer ${Redacted.value(config.collector.token)}`)
				)
			)
		)
		return yield* HttpApiClient.makeWith(CollectorApi, {httpClient, baseUrl: config.collector.url})
	}),
	accessors: true
}) {}

import CollectorApi from "@ecrawler/api/collector/index.ts"
import {Effect} from "effect"
import {HttpClient} from "@effect/platform/HttpClient"
import {HttpApiClient} from "@effect/platform"
import {WorkerConfig} from "../config.ts"

export default class CollectorClient extends Effect.Service<CollectorClient>()("@ecrawler/worker/CollectorClient", {
	effect: Effect.gen(function* () {
		const config = yield* WorkerConfig
		return yield* HttpApiClient.makeWith(CollectorApi, {
			httpClient: yield* HttpClient,
			baseUrl: config.collector.url
		})
	}),
	accessors: true
}) {}

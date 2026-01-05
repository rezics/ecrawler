import DispatcherApi from "@ecrawler/api/dispatcher/index.ts"
import {Effect} from "effect"
import {WorkerConfig} from "../config.ts"
import {HttpClient} from "@effect/platform/HttpClient"
import {HttpApiClient} from "@effect/platform"

export default class DispatcherClient extends Effect.Service<DispatcherClient>()(
	"@ecrawler/worker/DispatcherClient",
	{
		effect: Effect.gen(function* () {
			const config = yield* WorkerConfig
			return yield* HttpApiClient.makeWith(DispatcherApi, {
				httpClient: yield* HttpClient,
				baseUrl: config.dispatcher.url
			})
		}),
		accessors: true
	}
) {}

import {HttpApiClient, HttpClient, HttpClientRequest} from "@effect/platform"
import {Effect, Schema} from "effect"
import ScraperConfig from "../configs/index.ts"
import CollectorApi from "@ecrawler/collector/api"

export interface FailureInfo {
	type: string
	message: string
}

export class CollectorClient extends Effect.Service<CollectorClient>()(
	"CollectorClient",
	{
		effect: Effect.gen(function* () {
			const config = yield* ScraperConfig
			const httpClient = (yield* HttpClient.HttpClient).pipe(
				HttpClient.mapRequest(request =>
					request.pipe(
						HttpClientRequest.prependUrl(config.collectorUrl),
						HttpClientRequest.setHeader(
							"Authorization",
							`Bearer ${config.workerId}`
						)
					)
				)
			)

			const client = yield* HttpApiClient.makeWith(CollectorApi, {
				httpClient
			})

			return {
				submitSuccess: (taskId: string, data: object) =>
					client.Results.submitSuccess({
						payload: {
							taskId: taskId as typeof Schema.UUID.Type,
							data
						}
					}).pipe(Effect.map(result => result.id)),

				submitFailure: (taskId: string, error: FailureInfo) =>
					client.Results.submitFailure({
						payload: {
							taskId: taskId as typeof Schema.UUID.Type,
							error
						}
					}).pipe(Effect.map(result => result.id))
			}
		})
	}
) {}

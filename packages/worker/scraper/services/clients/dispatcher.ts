import {HttpApiClient, HttpClient, HttpClientRequest} from "@effect/platform"
import {Effect, Schema} from "effect"
import ScraperConfig from "../configs/index.ts"
import DispatcherApi from "@ecrawler/dispatcher/api"

export class DispatcherClient extends Effect.Service<DispatcherClient>()(
	"DispatcherClient",
	{
		effect: Effect.gen(function* () {
			const config = yield* ScraperConfig
			const httpClient = (yield* HttpClient.HttpClient).pipe(
				HttpClient.mapRequest(request =>
					request.pipe(
						HttpClientRequest.prependUrl(config.dispatcherUrl),
						HttpClientRequest.setHeader(
							"Authorization",
							`Bearer ${config.workerId}`
						)
					)
				)
			)

			const client = yield* HttpApiClient.makeWith(DispatcherApi, {
				httpClient
			})

			return {
				nextTask: (tags: readonly string[]) =>
					client.Tasks["next-task"]({
						payload: {tags: [...tags]}
					}).pipe(
						Effect.map(task => task),
						Effect.catchTag("TaskNotFoundError", () =>
							Effect.succeed(null)
						)
					),

				addTask: (payload: {tags: readonly string[]}) =>
					client.Tasks["add-task"]({
						payload: {tags: [...payload.tags]}
					}),

				removeTask: (id: string) =>
					client.Tasks["remove-task"]({
						payload: {id: id as typeof Schema.UUID.Type}
					})
			}
		})
	}
) {}

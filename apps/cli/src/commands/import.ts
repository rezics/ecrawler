import {Args, Command, Options} from "@effect/cli"
import DispatcherApi from "@ecrawler/api/dispatcher/index.ts"
import {FileSystem, HttpApiClient, HttpClient, HttpClientRequest} from "@effect/platform"
import {Array, Effect, Schema} from "effect"

const TaskSchema = Schema.Struct({tags: Schema.Array(Schema.String), link: Schema.String})
const TasksFileSchema = Schema.Array(TaskSchema)

export const Import = Command.make(
	"import",
	{
		dispatcher: Args.text({name: "dispatcher"}).pipe(Args.withDescription("Dispatcher API base URL")),
		token: Options.text("token").pipe(Options.withAlias("t"), Options.withDescription("Dispatcher API token")),
		inputs: Options.file("input").pipe(
			Options.withAlias("i"),
			Options.atLeast(1),
			Options.withDescription("Task JSON files to import")
		)
	},
	({dispatcher, token, inputs}) =>
		Effect.gen(function* () {
			const httpClient = yield* HttpClient.HttpClient.pipe(
				Effect.map(HttpClient.mapRequest(HttpClientRequest.setHeader("Authorization", `Bearer ${token}`)))
			)
			const {dispatcher: client} = yield* HttpApiClient.makeWith(DispatcherApi, {
				httpClient,
				baseUrl: dispatcher
			})

			const fs = yield* FileSystem.FileSystem

			const taskArrays = yield* Effect.forEach(inputs, file =>
				fs.readFileString(file).pipe(
					Effect.flatMap(Schema.decode(Schema.parseJson(TasksFileSchema))),
					Effect.mapError(e => new Error(`Failed to parse ${file}: ${e}`))
				)
			)

			const tasks = Array.flatten(taskArrays)

			yield* Effect.forEach(tasks, task => client.createTask({payload: task}))

			yield* Effect.log(`Imported ${Array.length(tasks)} tasks`)
		})
).pipe(Command.withDescription("Import tasks to the Dispatcher API\n\n导入抓取任务数据到调度器"))

import {Command, Options} from "@effect/cli"
import DispatcherApi from "@ecrawler/api/dispatcher/index.ts"
import {FileSystem, HttpApiClient, HttpClient} from "@effect/platform"
import {Array, Effect, Schema} from "effect"

const TaskSchema = Schema.Struct({tags: Schema.Array(Schema.String), link: Schema.String})

export const Import = Command.make(
	"import",
	{
		dispatcher: Options.text("dispatcher").pipe(
			Options.withAlias("d"),
			Options.withDescription("Dispatcher API base URL")
		),
		files: Options.file("file").pipe(
			Options.withAlias("f"),
			Options.atLeast(1),
			Options.withDescription("Task JSON files to import")
		)
	},
	({dispatcher, files}) =>
		Effect.gen(function* () {
			const {dispatcher: client} = yield* HttpApiClient.makeWith(DispatcherApi, {
				httpClient: yield* HttpClient.HttpClient,
				baseUrl: dispatcher
			})

			const fs = yield* FileSystem.FileSystem

			const tasks = yield* Effect.forEach(files, file =>
				fs.readFileString(file).pipe(
					Effect.flatMap(Schema.decode(Schema.parseJson(TaskSchema))),
					Effect.mapError(e => new Error(`Failed to parse ${file}: ${e}`))
				)
			)

			yield* Effect.forEach(tasks, task => client.createTask({payload: task}))

			yield* Effect.log(`Imported ${Array.length(tasks)} tasks`)
		})
).pipe(Command.withDescription("Import tasks to the Dispatcher API\n\n导入抓取任务数据到调度器"))

import {Args, Command, Options} from "@effect/cli"
import DispatcherApi from "@ecrawler/api/dispatcher/index.ts"
import {
  FileSystem,
  HttpApiClient,
  HttpClient,
  HttpClientRequest
} from "@effect/platform"
import {Effect, Option, Schema} from "effect"

const TaskInput = Schema.Struct({
  tags: Schema.optional(Schema.String.pipe(Schema.Array)),
  link: Schema.optional(Schema.String),
  url: Schema.optional(Schema.String),
  href: Schema.optional(Schema.String),
  meta: Schema.optional(Schema.Unknown),
  metadata: Schema.optional(Schema.Unknown)
}).pipe(Schema.partial)

const TaskArray = Schema.Array(TaskInput)

export const Import = Command.make(
  "import",
  {
    dispatcher: Args.text({name: "dispatcher"}).pipe(
      Args.withDescription("Dispatcher API base URL")
    ),
    token: Options.text("token").pipe(
      Options.withAlias("t"),
      Options.withDescription("Dispatcher API token")
    ),
    input: Options.text("input").pipe(
      Options.withAlias("i"),
      Options.withDescription("Input file path (JSON array of tasks)")
    ),
    tags: Options.optional(
      Options.text("tags").pipe(Options.withDescription("Tags for all tasks"))
    )
  },
  ({dispatcher, token, input, tags}) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem

      const fileContent = yield* fs.readFileString(input)

      const tasks = yield* Schema.decodeUnknown(TaskArray)(fileContent)

      const httpClient = yield* HttpClient.HttpClient.pipe(
        Effect.map(
          HttpClient.mapRequest(
            HttpClientRequest.setHeader("Authorization", `Bearer ${token}`)
          )
        )
      )
      const {dispatcher: client} = yield* HttpApiClient.makeWith(
        DispatcherApi,
        {httpClient, baseUrl: dispatcher}
      )

      const tagList = Option.getOrUndefined(tags)?.split(",") ?? []

      const results: {link: string; id?: string; exists: boolean}[] = []

      for (const task of tasks) {
        const taskTags = task.tags ?? tagList
        const taskLink = task.link ?? task.url ?? task.href

        if (!taskLink) {
          results.push({link: "unknown", exists: false})
          continue
        }

        const result = yield* client.createTask({
          payload: {
            tags: taskTags,
            link: taskLink,
            meta: task.meta ?? task.metadata
          }
        })

        const taskResult = result as {id?: string} | null

        results.push({
          link: taskLink,
          id: taskResult?.id,
          exists: taskResult === null
        })
      }

      const imported = results.filter(r => r.id !== undefined).length
      const skipped = results.filter(r => r.exists).length
      const failed = results.filter(r => !r.exists && r.id === undefined).length

      console.log(
        `Import complete: ${imported} imported, ${skipped} skipped (already exists), ${failed} failed`
      )
    })
).pipe(
  Command.withDescription(
    "Import tasks to the Dispatcher API\n\n将任务导入到调度器 API"
  )
)

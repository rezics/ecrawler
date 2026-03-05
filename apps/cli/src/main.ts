import {Command, Options} from "@effect/cli"
import pkg from "../package.json" with {type: "json"}
import {Import} from "./commands/import.ts"
import {Export} from "./commands/export.ts"
import CollectorApi from "@ecrawler/api/collector/index.ts"
import DispatcherApi from "@ecrawler/api/dispatcher/index.ts"
import {HttpApiClient, HttpClient, HttpClientRequest} from "@effect/platform"
import {Effect, Layer, Option} from "effect"
import {NodeContext, NodeHttpClient, NodeRuntime} from "@effect/platform-node"

const Token = Options.text("token").pipe(
  Options.withAlias("t"),
  Options.withDescription("API token")
)

const CollectorFlags = Options.optional(
  Options.text("collector").pipe(
    Options.withAlias("c"),
    Options.withDescription("Collector API base URL")
  )
)

const DispatcherFlags = Options.optional(
  Options.text("dispatcher").pipe(
    Options.withAlias("d"),
    Options.withDescription("Dispatcher API base URL")
  )
)

const Tags = Options.optional(
  Options.text("tags").pipe(Options.withDescription("Filter by tags"))
)

const Since = Options.optional(
  Options.date("since").pipe(
    Options.withDescription("Filter results after this date")
  )
)

const Before = Options.optional(
  Options.date("before").pipe(
    Options.withDescription("Filter results before this date")
  )
)

const Limit = Options.optional(
  Options.integer("limit").pipe(
    Options.withDescription("Maximum number of results")
  )
)

const Offset = Options.optional(
  Options.integer("offset").pipe(
    Options.withDescription("Number of results to skip")
  )
)

const ListCommand = Command.make("list", {token: Token}, ({token}) =>
  Effect.gen(function* () {
    const baseUrl = process.env["ECRAWLER_API_URL"] ?? "http://localhost:3000"

    const httpClient = yield* HttpClient.HttpClient.pipe(
      Effect.map(
        HttpClient.mapRequest(
          HttpClientRequest.setHeader("Authorization", `Bearer ${token}`)
        )
      )
    )

    const {collector: client} = yield* HttpApiClient.makeWith(CollectorApi, {
      httpClient,
      baseUrl
    })

    const result = yield* client.getResults({
      urlParams: {limit: 100, data: true}
    })

    console.log(JSON.stringify(result, null, 2))
  })
).pipe(Command.withDescription("List all results from the Collector API"))

const TasksCommand = Command.make(
  "tasks",
  {
    token: Token,
    collector: CollectorFlags,
    dispatcher: DispatcherFlags,
    tags: Tags,
    since: Since,
    before: Before,
    limit: Limit,
    offset: Offset,
    list: Options.boolean("list").pipe(Options.withAlias("l"))
  },
  ({token, collector, dispatcher, tags, since, before, limit, offset, list}) =>
    Effect.gen(function* () {
      const collectorUrl = Option.getOrUndefined(collector)
      const dispatcherUrl = Option.getOrUndefined(dispatcher)
      const baseUrl =
        collectorUrl ??
        dispatcherUrl ??
        process.env["ECRAWLER_API_URL"] ??
        "http://localhost:3000"

      const httpClient = yield* HttpClient.HttpClient.pipe(
        Effect.map(
          HttpClient.mapRequest(
            HttpClientRequest.setHeader("Authorization", `Bearer ${token}`)
          )
        )
      )

      const tagList = Option.getOrUndefined(tags)?.split(",")
      const sinceDate = Option.getOrUndefined(since)
      const beforeDate = Option.getOrUndefined(before)
      const limitNum = Option.getOrUndefined(limit)
      const offsetNum = Option.getOrUndefined(offset)

      const params = {
        tags: tagList,
        since: sinceDate,
        before: beforeDate,
        limit: limitNum,
        offset: offsetNum
      }

      if (list) {
        if (dispatcherUrl || !collectorUrl) {
          const {dispatcher: client} = yield* HttpApiClient.makeWith(
            DispatcherApi,
            {httpClient, baseUrl}
          )

          const result = yield* client.getTasks({urlParams: params})

          console.log(JSON.stringify(result, null, 2))
        } else {
          const {collector: client} = yield* HttpApiClient.makeWith(
            CollectorApi,
            {httpClient, baseUrl}
          )

          const result = yield* client.getResults({urlParams: params})

          console.log(JSON.stringify(result, null, 2))
        }
      } else {
        console.log("Use --list or -l to list tasks")
      }
    })
).pipe(
  Command.withDescription(
    "Manage tasks via Dispatcher or results via Collector"
  )
)

const program = Command.run(
  Command.make("ecrawler").pipe(
    Command.withSubcommands([Import, Export, ListCommand, TasksCommand])
  ),
  {name: pkg.name, version: pkg.version}
)

const cliProgram = program(process.argv)

NodeRuntime.runMain(
  cliProgram.pipe(
    Effect.provide(Layer.mergeAll(NodeContext.layer, NodeHttpClient.layer))
  )
)

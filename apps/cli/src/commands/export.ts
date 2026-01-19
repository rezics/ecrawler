import {Args, Command, Options} from "@effect/cli"
import CollectorApi from "@ecrawler/api/collector/index.ts"
import {FileSystem, HttpApiClient, HttpClient, HttpClientRequest} from "@effect/platform"
import {Effect, Option} from "effect"

export const Export = Command.make(
  "export",
  {
    collector: Args.text({name: "collector"}).pipe(Args.withDescription("Collector API base URL")),
    token: Options.text("token").pipe(
      Options.withAlias("t"),
      Options.withDescription("Collector API token")
    ),
    output: Options.text("output").pipe(
      Options.withAlias("o"),
      Options.withDescription("Output file path")
    ),
    id: Options.optional(Options.text("id").pipe(Options.withDescription("Filter by result ID"))),
    by: Options.optional(Options.text("by").pipe(Options.withDescription("Filter by worker ID"))),
    since: Options.optional(
      Options.date("since").pipe(Options.withDescription("Filter results after this date"))
    ),
    before: Options.optional(
      Options.date("before").pipe(Options.withDescription("Filter results before this date"))
    ),
    limit: Options.optional(
      Options.integer("limit").pipe(Options.withDescription("Maximum number of results"))
    ),
    offset: Options.optional(
      Options.integer("offset").pipe(Options.withDescription("Number of results to skip"))
    )
  },
  ({collector, token, output, id, by, since, before, limit, offset}) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem

      const httpClient = yield* HttpClient.HttpClient.pipe(
        Effect.map(
          HttpClient.mapRequest(HttpClientRequest.setHeader("Authorization", `Bearer ${token}`))
        )
      )
      const {collector: client} = yield* HttpApiClient.makeWith(CollectorApi, {
        httpClient,
        baseUrl: collector
      })

      const result = yield* client.getResults({
        urlParams: {
          id: Option.getOrUndefined(id),
          by: Option.getOrUndefined(by),
          since: Option.getOrUndefined(since),
          before: Option.getOrUndefined(before),
          limit: Option.getOrUndefined(limit),
          offset: Option.getOrUndefined(offset)
        }
      })

      return yield* fs.writeFileString(output, JSON.stringify(result, null, 2))
    })
).pipe(Command.withDescription("Export results from the Collector API\n\n从收集器导出抓取结果"))

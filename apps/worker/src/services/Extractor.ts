import {Effect, Layer} from "effect"
import {Link, Task, Record} from "@ecrawler/schemas"

export interface ExtractorResult {
  readonly records: Iterable<Record.Record>
  readonly links: Iterable<Link.Link>
}

export class Extractor extends Effect.Tag("Extractor")<
  Extractor,
  {extract: (task: Task.Task) => Effect.Effect<ExtractorResult>}
>() {
  static readonly Dummy = Layer.effect(
    Extractor,
    Effect.gen(function* () {
      return Extractor.of({
        extract: task =>
          Effect.succeed({
            records: [
              Record.Record.make({
                data: {url: task.link, timestamp: new Date().toISOString()}
              })
            ],
            links: []
          })
      })
    })
  )
}

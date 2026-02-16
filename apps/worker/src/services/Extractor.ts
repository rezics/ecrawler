import {Effect, Layer} from "effect"
import {Task} from "@ecrawler/schemas"

export interface ExtractorResult {
  readonly data: Iterable<unknown>
  readonly link: Iterable<string>
}

export class Extractor extends Effect.Tag("Extractor")<
  Extractor,
  {extract: (i: Task.Task) => Effect.Effect<ExtractorResult>}
>() {
  static readonly Dummy = Layer.effect(
    Extractor,
    Effect.gen(function* () {
      return Extractor.of({
        extract: task =>
          Effect.succeed({
            data: [{url: task.link, timestamp: new Date().toISOString()}],
            link: []
          })
      })
    })
  )
}

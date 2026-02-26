import {Context, Config, Layer} from "effect"
import {v7} from "uuid"

export class WorkerConfig extends Context.Tag("WorkerConfig")<
  WorkerConfig,
  {
    readonly id: string
    readonly name: string
    readonly tags: readonly string[]

    readonly baseUrl: string
    readonly secretKey: string
  }
>() {
  static readonly Default = Layer.effect(
    WorkerConfig,
    Config.all({
      id: Config.string("ID").pipe(Config.withDefault(v7())),
      name: Config.string("NAME").pipe(Config.withDefault("worker")),
      tags: Config.array(Config.string(), "TAGS").pipe(Config.withDefault([])),
      baseUrl: Config.string("BASE_URL"),
      secretKey: Config.string("SECRET_KEY")
    }).pipe(Config.map(config => WorkerConfig.of(config)))
  )
}

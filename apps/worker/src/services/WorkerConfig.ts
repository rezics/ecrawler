import {Config, Context, Duration, Layer} from "effect"
import {v7} from "uuid"

export class WorkerConfig extends Context.Tag("WorkerConfig")<
  WorkerConfig,
  {
    readonly id: string
    readonly name: string
    readonly tags: readonly string[]

    readonly baseUrl: string
    readonly secretKey: string

    readonly pollTimeout: number
    readonly renewInterval: Duration.Duration
  }
>() {
  static readonly Default = Layer.effect(
    WorkerConfig,
    Config.all({
      id: Config.string("ID").pipe(Config.withDefault(v7())),
      name: Config.string("NAME").pipe(Config.withDefault("worker")),
      tags: Config.array(Config.string(), "TAGS").pipe(Config.withDefault([])),
      baseUrl: Config.string("BASE_URL"),
      secretKey: Config.string("SECRET_KEY"),
      pollTimeout: Config.integer("POLL_TIMEOUT").pipe(Config.withDefault(30)),
      renewInterval: Config.integer("RENEW_INTERVAL_SECONDS").pipe(
        Config.withDefault(120),
        Config.map(Duration.seconds)
      )
    }).pipe(Config.map(config => WorkerConfig.of(config)))
  )
}

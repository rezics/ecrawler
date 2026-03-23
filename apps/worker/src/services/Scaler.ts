import {
  Chunk,
  Config,
  Context,
  Duration,
  Effect,
  Layer,
  Ref,
  Schedule,
  Option
} from "effect"
import {Task} from "@ecrawler/schemas"
import type {ExtractorResult} from "./Extractor.ts"

export interface Metrics {
  readonly task: Task.Task
  readonly result: ExtractorResult
  readonly duration: Duration.Duration
}

export class Scaler extends Context.Tag("Scaler")<
  Scaler,
  {
    init: Effect.Effect<number>
    next: (metrics: Metrics) => Effect.Effect<number>
  }
>() {
  static readonly EMAConfig = class EMAConfig extends Context.Tag("EMAConfig")<
    EMAConfig,
    {
      readonly window: number
      readonly capacity: number
      readonly alpha: number
      readonly slack: number
      readonly maintenanceInterval: Duration.Duration
    }
  >() {
    static readonly Default = Layer.effect(
      Scaler.EMAConfig,
      Config.all({
        window: Config.integer("EMA_WINDOW").pipe(Config.withDefault(10)),
        capacity: Config.integer("EMA_CAPACITY").pipe(
          Config.withDefault(0),
          Config.map(n => (n === 0 ? Infinity : n))
        ),
        alpha: Config.number("EMA_ALPHA").pipe(Config.withDefault(0.3)),
        slack: Config.number("EMA_SLACK").pipe(Config.withDefault(1.5)),
        maintenanceInterval: Config.integer(
          "EMA_MAINTENANCE_INTERVAL_SECONDS"
        ).pipe(Config.withDefault(300), Config.map(Duration.seconds))
      }).pipe(Config.map(Scaler.EMAConfig.of))
    )
  }

  static readonly EMA = Layer.scoped(
    Scaler,
    Effect.gen(function* () {
      const config = yield* Scaler.EMAConfig

      const limit = yield* Ref.make(1)
      const ema = yield* Ref.make(Duration.zero)
      const min = yield* Ref.make(Duration.infinity)
      const stats = yield* Ref.make(Chunk.empty<Duration.Duration>())

      const up = () =>
        Ref.updateAndGet(limit, n => Math.min(n + 1, config.capacity))

      const down = () => Ref.updateAndGet(limit, n => Math.max(n / 2, 1))

      const maintenance = Effect.gen(function* () {
        yield* down()
        yield* Ref.set(min, yield* Ref.get(ema))
      }).pipe(Effect.repeat(Schedule.spaced(config.maintenanceInterval)))

      yield* maintenance.pipe(Effect.forkScoped)

      return Scaler.of({
        init: Effect.succeed(1),
        next: metrics => {
          return Effect.gen(function* () {
            yield* Ref.update(stats, s =>
              Chunk.append(
                Chunk.size(s) < config.window ? s : Chunk.drop(s, 1),
                metrics.duration
              )
            )

            const samples = yield* Ref.get(stats)
            if (Chunk.size(samples) < config.window) {
              return yield* Ref.get(limit)
            }

            const avg = Duration.divide(
              Chunk.reduce(samples, Duration.zero, Duration.sum),
              config.window
            ).pipe(Option.getOrThrow)

            const next = Duration.decode(
              config.alpha * Duration.toMillis(avg) +
                (1 - config.alpha) * Duration.toMillis(yield* Ref.get(ema))
            )

            yield* Ref.set(ema, next)
            const currentMin = yield* Ref.get(min)
            if (Duration.lessThan(next, currentMin)) {
              yield* Ref.set(min, next)
            }

            if (
              Duration.lessThan(next, Duration.times(currentMin, config.slack))
            ) {
              return yield* up()
            } else {
              return yield* down()
            }
          })
        }
      })
    })
  )
}

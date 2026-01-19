import {Context, Effect, Queue} from "effect"
import type {NetworkProxy} from "./NetworkProxy"

export type NetworkProxyProvider = NetworkProxyProvider.NetworkProxyProvider

export namespace NetworkProxyProvider {
  export class NetworkProxyProvider extends Context.Tag("@ecrawler/proxy/NetworkProxyProvider")<
    NetworkProxyProvider,
    Queue.Queue<NetworkProxy>
  >() {}

  export const roundRobin = (
    ...providers: Context.Tag.Service<NetworkProxyProvider>[]
  ): Effect.Effect<Queue.Queue<NetworkProxy>> =>
    Effect.gen(function* () {
      const out = yield* Queue.bounded<NetworkProxy>(1)

      yield* Effect.fork(
        Effect.forEach(providers, provider =>
          Queue.take(provider).pipe(Effect.flatMap(proxy => Queue.offer(out, proxy)))
        ).pipe(Effect.forever)
      )

      return out
    })
}

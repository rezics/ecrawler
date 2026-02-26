import {Effect, Layer, Ref, Schedule} from "effect"
import type {ProxyType} from "../schema/index.js"
import {WebshareClient} from "../webshare/Client.js"
import {ProxyPoolEmptyError} from "../errors.js"
import type {WebshareApiError} from "../errors.js"

export class ProxyPool extends Effect.Tag("ProxyPool")<
  ProxyPool,
  {
    readonly next: () => Effect.Effect<ProxyType, ProxyPoolEmptyError>
    readonly refresh: () => Effect.Effect<void, WebshareApiError>
  }
>() {
  static readonly WebshareDefault = Layer.scoped(
    ProxyPool,
    Effect.gen(function* () {
      const client = yield* WebshareClient
      const initial = yield* client.listProxies({valid: true})
      const ref = yield* Ref.make({proxies: initial, cursor: 0})

      const next = () =>
        Effect.gen(function* () {
          const {proxies, cursor} = yield* Ref.get(ref)
          if (proxies.length === 0) {
            return yield* Effect.fail(new ProxyPoolEmptyError())
          }
          const nextCursor = (cursor + 1) % proxies.length
          yield* Ref.update(ref, s => ({...s, cursor: nextCursor}))
          return proxies[cursor]!
        })

      const refresh = () =>
        Effect.gen(function* () {
          const list = yield* client.listProxies({valid: true})
          yield* Ref.set(ref, {proxies: list, cursor: 0})
        })

      yield* refresh().pipe(
        Effect.repeat(Schedule.fixed("10 minutes")),
        Effect.forkScoped
      )

      return ProxyPool.of({next, refresh})
    })
  )
}

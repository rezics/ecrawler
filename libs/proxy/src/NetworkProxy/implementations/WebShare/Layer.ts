import {Effect, Layer, Ref} from "effect"
import {NetworkProxy} from "../../NetworkProxy"
import {Exhausted} from "../../errors/index.ts"
import type {NetworkProxyError} from "../../errors/index.ts"
import type {Proxy} from "../../types/Proxy/Proxy"
import type {ProxyRequest} from "../../types/Proxy/ProxyRequest"
import {WebShareClient} from "./Client"
import type {WebShareProxy} from "./Schemas"

const toProxy = (p: WebShareProxy): Proxy => ({
  host: p.proxy_address,
  port: p.port,
  username: p.username,
  password: p.password,
  protocol: "http"
})

interface PageState {
  readonly buffer: ReadonlyArray<WebShareProxy>
  readonly cursor: number
  readonly page: number
  readonly hasMore: boolean
}

const initialState = (): PageState => ({
  buffer: [],
  cursor: 0,
  page: 1,
  hasMore: true
})

export const WebShare = Layer.effect(
  NetworkProxy,
  Effect.gen(function* () {
    const client = yield* WebShareClient

    const makeIterator = (
      request: ProxyRequest = {}
    ): Iterator<Effect.Effect<Proxy, NetworkProxyError>> => {
      const stateRef = Ref.unsafeMake<PageState>(initialState())

      return {
        next(): IteratorResult<Effect.Effect<Proxy, NetworkProxyError>> {
          const value = Effect.gen(function* () {
            let state = yield* Ref.get(stateRef)

            while (state.cursor >= state.buffer.length) {
              if (!state.hasMore) return yield* new Exhausted()

              const page = yield* client.list(state.page, request)
              const next: PageState = {
                buffer: page.results,
                cursor: 0,
                page: state.page + 1,
                hasMore: page.next !== null
              }
              yield* Ref.set(stateRef, next)
              state = next
            }

            const proxy = state.buffer[state.cursor]!
            yield* Ref.set(stateRef, {...state, cursor: state.cursor + 1})
            return toProxy(proxy)
          })

          return {done: false, value}
        }
      }
    }

    return {
      [Symbol.iterator](request?: ProxyRequest) {
        return makeIterator(request)
      }
    }
  })
)

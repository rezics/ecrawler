import {Array, Effect, flow, Layer} from "effect"
import {NetworkProxy} from "@ecrawler/proxy"
import {WebShareClient} from "./Client"
import type {WebShareProxy} from "./Schemas"

const toProxy = (p: WebShareProxy): NetworkProxy.ProxyResult => ({
  host: p.proxy_address,
  port: p.port,
  username: p.username,
  password: p.password,
  protocol: "http"
})

export const WebShare = Layer.effect(
  NetworkProxy.NetworkProxy,
  Effect.gen(function* () {
    const client = yield* WebShareClient

    return function* (request = {}) {
      let page = 1
      let ended = false
      let buffer: WebShareProxy[] = []
      let effect = client.list(page, request)

      while (true) {
        yield Effect.gen(function* () {
          const result = yield* effect
          ended = !result.next
          buffer.push(...result.results)

          return toProxy(buffer.shift()!)
        })

        yield* Array.map(buffer, flow(toProxy, Effect.succeed))

        if (ended) {
          page = 1
        } else {
          page++
        }
        buffer = []
        effect = client.list(page, request)
      }
    }
  })
)

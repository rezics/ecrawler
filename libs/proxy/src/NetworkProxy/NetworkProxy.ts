import {Context, Effect} from "effect"
import type {NetworkProxyError} from "./errors/index.ts"
import {Proxy} from "./types"
import type {Simplify} from "effect/Types"

export interface NetworkProxyShape {
  [Symbol.iterator](
    request?: Proxy.ProxyRequest
  ): Iterator<Effect.Effect<Proxy.Proxy, NetworkProxyError>>
}

export class NetworkProxy extends Context.Tag(
  "@ecrawler/proxy/NetworkProxy/NetworkProxy"
)<NetworkProxy, Simplify<NetworkProxyShape>>() {}

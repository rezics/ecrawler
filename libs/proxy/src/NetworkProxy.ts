import {Context, Effect} from "effect"
import * as NetworkProxyError from "./NetworkProxyError.ts"
import * as Proxy from "./NetworkProxy"

export type NetworkProxyShape = (
  request?: ProxyRequest
) => IterableIterator<Effect.Effect<Proxy.ProxyResult, NetworkProxyError.All>>

export class NetworkProxy extends Context.Tag(
  "@ecrawler/proxy/NetworkProxy/NetworkProxy"
)<NetworkProxy, NetworkProxyShape>() {}

export interface ProxyRequest {
  readonly country?: string
  readonly limit?: number
}

export interface ProxyResult {
  readonly host: string
  readonly port: number
  readonly username?: string
  readonly password?: string
  readonly protocol?: "http" | "https" | "socks5"
}

export const toProxyUrl = (result: ProxyResult) =>
  `${result.protocol}://${result.username}:${result.password}@${result.host}:${result.port}`

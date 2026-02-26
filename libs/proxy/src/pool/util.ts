import type {ProxyType} from "../schema/index.js"

export function toUrl(proxy: ProxyType): URL {
  return new URL(
    `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`
  )
}

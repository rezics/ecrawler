/**
 * Unified proxy connection config (intersection of provider capabilities).
 * Used by the Worker to configure HTTP client or browser proxy.
 */
export interface Proxy {
  readonly host: string
  readonly port: number
  readonly username?: string
  readonly password?: string
  readonly protocol?: "http" | "https" | "socks5"
}

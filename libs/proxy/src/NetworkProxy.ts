export type NetworkProxy = NetworkProxy.NetworkProxy

export namespace NetworkProxy {
  export interface NetworkProxy {
    readonly protocol: "http" | "https" | "socks5"
    readonly host: string
    readonly port: number

    readonly username?: string
    readonly password?: string
  }
}

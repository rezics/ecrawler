import {Config, Context, Layer} from "effect"

export interface WebShareConfigShape {
  readonly apiToken: string
  readonly baseUrl: string
  readonly pageSize: number
}

export class WebShareConfig extends Context.Tag(
  "@ecrawler/proxy/NetworkProxy/WebShare/Config"
)<WebShareConfig, WebShareConfigShape>() {
  static readonly layer = Layer.effect(
    WebShareConfig,
    Config.all({
      apiToken: Config.string("WEBSHARE_API_TOKEN"),
      baseUrl: Config.string("WEBSHARE_API_URL").pipe(
        Config.withDefault("https://proxy.webshare.io")
      ),
      pageSize: Config.number("WEBSHARE_PAGE_SIZE").pipe(
        Config.withDefault(100)
      )
    })
  )
}

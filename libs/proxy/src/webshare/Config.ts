import {Config, Context, Layer, Option} from "effect"

export class WebshareConfig extends Context.Tag("WebshareConfig")<
  WebshareConfig,
  {readonly apiKey: string; readonly planId: Option.Option<string>}
>() {
  static readonly Default = Layer.effect(
    WebshareConfig,
    Config.all({
      apiKey: Config.string("WEBSHARE_API_KEY"),
      planId: Config.option(Config.string("WEBSHARE_PLAN_ID"))
    }).pipe(Config.map(config => WebshareConfig.of(config)))
  )
}

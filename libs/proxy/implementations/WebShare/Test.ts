import "dotenv/config"
import {Effect, Layer} from "effect"
import {NodeContext, NodeHttpClient, NodeRuntime} from "@effect/platform-node"
import {NetworkProxy} from "../../src"
import {WebShare} from "./Layer"
import {WebShareClient} from "./Client"
import {WebShareConfig} from "./Config"

const main = () =>
  Effect.gen(function* () {
    const proxies = yield* NetworkProxy.NetworkProxy

    for (const effect of proxies()) {
      const proxy = yield* effect

      yield* Effect.log(proxy)
    }
  }).pipe(
    Effect.provide(
      WebShare.pipe(
        Layer.provide(
          WebShareClient.layer.pipe(Layer.provide(WebShareConfig.layer))
        ),
        Layer.provide(Layer.mergeAll(NodeContext.layer, NodeHttpClient.layer))
      )
    ),
    NodeRuntime.runMain
  )

main()

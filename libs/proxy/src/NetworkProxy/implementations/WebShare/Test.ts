import "dotenv/config"
import {Effect, Layer} from "effect"
import {NodeContext, NodeHttpClient, NodeRuntime} from "@effect/platform-node"
import {NetworkProxy} from "../../.."
import {WebShare} from "./Layer"
import {WebShareClient} from "./Client"
import {WebShareConfig} from "./Config"

const main = () =>
  Effect.gen(function* () {
    const proxies = yield* NetworkProxy.NetworkProxy

    for (const _proxy of proxies) {
      const proxy = yield* _proxy

      yield* Effect.log(proxy)

      yield* Effect.sleep("1 seconds")
    }
  }).pipe(
    Effect.provide(
      WebShare.pipe(
        Layer.provide(
          WebShareClient.layer.pipe(
            Layer.provide(
              Layer.mergeAll(
                WebShareConfig.layer,
                NodeHttpClient.layerUndici,
                NodeContext.layer
              )
            )
          )
        )
      )
    ),
    NodeRuntime.runMain
  )

main()

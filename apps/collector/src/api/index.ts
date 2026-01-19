import {Layer} from "effect"
import root from "./groups/root"
import {system} from "@ecrawler/core/api/util.ts"
import auth from "./auth"
import {HttpApiBuilder} from "@effect/platform"
import Collector from "@ecrawler/api/collector/index.ts"
import {ServerLive} from "@ecrawler/core/server/layer.ts"

export default Layer.provideMerge(
  ServerLive,
  HttpApiBuilder.api(Collector).pipe(
    Layer.provide(system),
    Layer.provide(Layer.provideMerge(root, auth))
  )
)

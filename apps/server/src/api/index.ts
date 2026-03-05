import {Layer} from "effect"
import root from "./groups/root"
import {system} from "./util.ts"
import Auth from "./middlewares/Auth.ts"
import MaxBodySize from "./middlewares/MaxBodySize.ts"
import {HttpApiBuilder} from "@effect/platform"
import Collector from "@ecrawler/api/collector/index.ts"
import Dispatcher from "@ecrawler/api/dispatcher/index.ts"
import {ServerLive} from "../server/layer.ts"

const middlewares = Layer.mergeAll(Auth, MaxBodySize)

const CollectorApi = Layer.provideMerge(
  ServerLive,
  HttpApiBuilder.api(Collector).pipe(
    Layer.provide(system),
    Layer.provide(Layer.provideMerge(root, middlewares))
  )
)

const DispatcherApi = Layer.provideMerge(
  ServerLive,
  HttpApiBuilder.api(Dispatcher).pipe(
    Layer.provide(system),
    Layer.provide(Layer.provideMerge(root, middlewares))
  )
)

export default Layer.merge(CollectorApi, DispatcherApi)

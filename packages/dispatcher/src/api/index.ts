import {Layer} from "effect"
import root from "./groups/root"
import {system} from "@ecrawler/core/api/util.js"
import auth from "./auth"
import {HttpApiBuilder} from "@effect/platform"
import Dispatcher from "@ecrawler/api/dispatcher/index.js"
import {ServerLive} from "@ecrawler/core/server/layer.js"

export default Layer.provideMerge(
	ServerLive,
	HttpApiBuilder.api(Dispatcher).pipe(
		Layer.provide(system),
		Layer.provide(Layer.provideMerge(root, auth))
	)
)

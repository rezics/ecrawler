import {Effect} from "effect"
import {createModuleLoader, ModuleLoaderError} from "@ecrawler/worker-core"
import type {Discoverer} from "../interfaces/index.ts"

export {ModuleLoaderError as DiscovererLoaderError}

export class DiscovererLoader extends Effect.Service<DiscovererLoader>()(
	"DiscovererLoader",
	{
		effect: createModuleLoader<Discoverer>(
			"DiscovererLoader",
			import.meta.dirname,
			"../implements"
		)
	}
) {}

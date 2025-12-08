import {Effect} from "effect"
import {createModuleLoader, ModuleLoaderError} from "@ecrawler/worker-core"
import type {Scraper} from "../interfaces/index.ts"

export {ModuleLoaderError as ScraperLoaderError}

export class ScraperLoader extends Effect.Service<ScraperLoader>()(
	"ScraperLoader",
	{
		effect: createModuleLoader<Scraper>(
			"ScraperLoader",
			import.meta.dirname,
			"../implements"
		)
	}
) {}

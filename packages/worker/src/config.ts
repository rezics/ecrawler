import {Config, Effect} from "effect"

const config = Config.all({
	dispatcher: Config.all({
		url: Config.url("DISPATCHER_BASE_URL")
	}),
	collector: Config.all({
		url: Config.url("COLLECTOR_BASE_URL")
	}),
	layers: Config.array(Config.url(), "LAYERS")
})

export class WorkerConfig extends Effect.Service<WorkerConfig>()(
	"@ecrawler/worker/Config",
	{
		effect: Config.unwrap(config),
		accessors: true
	}
) {}

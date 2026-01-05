import {Config} from "effect"

export const WorkerConfig = Config.all({
	id: Config.string("ID"),
	dispatcher: Config.all({
		url: Config.url("DISPATCHER_BASE_URL")
	}),
	collector: Config.all({
		url: Config.url("COLLECTOR_BASE_URL")
	}),
	workers: Config.array(Config.string(), "WORKERS")
}).pipe(Config.unwrap)

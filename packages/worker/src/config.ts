import {Config, Duration} from "effect"

export const WorkerConfig = Config.all({
	id: Config.string("ID"),
	dispatcher: Config.all({url: Config.url("DISPATCHER_BASE_URL")}),
	collector: Config.all({url: Config.url("COLLECTOR_BASE_URL")}),
	timeout: Config.duration("TIMEOUT").pipe(Config.withDefault(Duration.minutes(1))),
	limit: Config.number("LIMIT").pipe(Config.withDefault(Infinity)),
	workers: Config.array(Config.string(), "WORKERS")
}).pipe(Config.unwrap)

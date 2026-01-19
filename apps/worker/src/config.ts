import {Config, Duration, Redacted} from "effect"
import {v7} from "uuid"

export const WorkerConfig = Config.all({
	id: Config.string("ID").pipe(Config.withDefault(v7())),
	dispatcher: Config.all({
		url: Config.url("DISPATCHER_BASE_URL"),
		token: Config.redacted("DISPATCHER_TOKEN")
	}),
	collector: Config.all({
		url: Config.url("COLLECTOR_BASE_URL"),
		token: Config.redacted("COLLECTOR_TOKEN")
	}),
	timeout: Config.duration("TIMEOUT").pipe(Config.withDefault(Duration.minutes(1))),
	capacity: Config.number("CAPACITY").pipe(Config.withDefault(Infinity)),
	workers: Config.array(Config.string(), "WORKERS")
}).pipe(Config.unwrap)

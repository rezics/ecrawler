import {Config, Effect} from "effect"
import {
	WorkerIdConfig,
	DispatcherUrlConfig,
	ProxyUrlConfig,
	TagsConfig,
	MaxRetriesConfig,
	PollIntervalMsConfig
} from "@ecrawler/worker-core"

const ScraperConfigEffect = Effect.all({
	workerId: WorkerIdConfig,
	dispatcherUrl: DispatcherUrlConfig,
	collectorUrl: Config.string("COLLECTOR_URL"),
	proxyUrl: ProxyUrlConfig,
	tags: TagsConfig,
	maxRetries: MaxRetriesConfig,
	pollIntervalMs: PollIntervalMsConfig
})

export default class ScraperConfig extends Effect.Service<ScraperConfig>()(
	"ScraperConfig",
	{effect: ScraperConfigEffect}
) {}

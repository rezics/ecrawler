import {Config, Effect} from "effect"
import {
	WorkerIdConfig,
	DispatcherUrlConfig,
	ProxyUrlConfig,
	TagsConfig,
	MaxRetriesConfig,
	PollIntervalMsConfig
} from "@ecrawler/worker-core"

const DiscovererConfigEffect = Effect.all({
	workerId: WorkerIdConfig,
	dispatcherUrl: DispatcherUrlConfig,
	proxyUrl: ProxyUrlConfig,
	tags: TagsConfig,
	// 发现的 URL 要添加的 tags
	targetTags: Config.string("TARGET_TAGS").pipe(
		Config.map(s =>
			s
				.split(",")
				.map(t => t.trim())
				.filter(t => t.length > 0)
		),
		Config.withDefault([])
	),
	maxRetries: MaxRetriesConfig,
	pollIntervalMs: PollIntervalMsConfig
})

export default class DiscovererConfig extends Effect.Service<DiscovererConfig>()(
	"DiscovererConfig",
	{effect: DiscovererConfigEffect}
) {}

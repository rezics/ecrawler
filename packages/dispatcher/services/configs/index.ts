import {Config, Effect} from "effect"

const DispatcherConfigEffect = Effect.all({
	host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
	port: Config.number("PORT").pipe(Config.withDefault(3000)),
	databaseUrl: Config.redacted("DATABASE_URL")
})

export default class DispatcherConfig extends Effect.Service<DispatcherConfig>()(
	"DispatcherConfig",
	{effect: DispatcherConfigEffect}
) {}

import {Config, Effect} from "effect"

const CollectorConfigEffect = Effect.all({
	host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
	port: Config.number("PORT").pipe(Config.withDefault(3001)),
	databaseUrl: Config.redacted("DATABASE_URL")
})

export default class CollectorConfig extends Effect.Service<CollectorConfig>()(
	"CollectorConfig",
	{effect: CollectorConfigEffect}
) {}

import {Config, Effect} from "effect"

const config = Config.all({
	host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
	port: Config.number("PORT").pipe(Config.withDefault(3001)),
	databaseUrl: Config.redacted("DATABASE_URL")
})

export class CollectorConfig extends Effect.Service<CollectorConfig>()(
	"@ecrawler/collector/Config",
	{
		effect: Config.unwrap(config),
		accessors: true
	}
) {}

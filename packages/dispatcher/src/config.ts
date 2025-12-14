import {Config, Effect} from "effect"

const config = Config.all({
	host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
	port: Config.number("PORT").pipe(Config.withDefault(3000)),
	databaseUrl: Config.redacted("DATABASE_URL")
})

export class DispatcherConfig extends Effect.Service<DispatcherConfig>()(
	"@ecrawler/dispatcher/Config",
	{
		effect: Config.unwrap(config),
		accessors: true
	}
) {}

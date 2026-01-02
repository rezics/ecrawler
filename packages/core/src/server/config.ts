import {Config, Effect} from "effect"

export class ServerConfig extends Effect.Service<ServerConfig>()(
	"@ecrawler/core/ServerConfig",
	{
		effect: Config.all({
			host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
			port: Config.number("PORT").pipe(Config.withDefault(3000))
		}).pipe(Config.unwrap),
		accessors: true
	}
) {}

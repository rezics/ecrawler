import {Config, Effect} from "effect"

export class DatabaseConfig extends Effect.Service<DatabaseConfig>()(
	"@ecrawler/core/DatabaseConfig",
	{
		effect: Config.all({
			url: Config.redacted("DATABASE_URL")
		}).pipe(Config.unwrap),
		accessors: true
	}
) {}

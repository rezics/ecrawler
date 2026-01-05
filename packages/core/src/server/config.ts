import {Config} from "effect"

export const ServerConfig = Config.all({
	host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
	port: Config.number("PORT").pipe(Config.withDefault(3000))
}).pipe(Config.unwrap)

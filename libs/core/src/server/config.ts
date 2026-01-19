import {Config} from "effect"

export const ServerConfig = Config.all({
  host: Config.string("HOST"),
  port: Config.number("PORT"),
  database: Config.all({url: Config.redacted(Config.string("DATABASE_URL"))})
}).pipe(Config.unwrap)

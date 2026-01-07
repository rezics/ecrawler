import {Config} from "effect"

export const DatabaseConfig = Config.all({url: Config.redacted("DATABASE_URL")}).pipe(Config.unwrap)

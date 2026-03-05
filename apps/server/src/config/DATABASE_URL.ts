import {Config} from "effect"

export const DATABASE_URL = Config.redacted(Config.string("DATABASE_URL"))

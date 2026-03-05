import {Config} from "effect"
import {HOST} from "./HOST.ts"
import {PORT} from "./PORT.ts"
import {DATABASE_URL} from "./DATABASE_URL.ts"

export const ServerConfig = Config.all({
  host: HOST,
  port: PORT,
  database: DATABASE_URL
})

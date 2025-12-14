import {makeDatabaseLayer} from "@ecrawler/core/database"
import {DispatcherConfig} from "../config.ts"

export const DatabaseLive = makeDatabaseLayer(DispatcherConfig)

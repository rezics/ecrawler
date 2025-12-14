import {makeDatabaseLayer} from "@ecrawler/core/database"
import {CollectorConfig} from "../config.ts"

export const DatabaseLive = makeDatabaseLayer(CollectorConfig)

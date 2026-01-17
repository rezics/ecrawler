import {ServerConfig} from "@ecrawler/core/server/config.ts"
import {defineConfig} from "drizzle-kit"
import {Effect, Redacted} from "effect"
import {loadEnvFile} from "node:process"

loadEnvFile("../../.env.development")

const config = ServerConfig.pipe(Effect.runSync)

export default defineConfig({
	dbCredentials: {url: Redacted.value(config.database.url)},
	dialect: "postgresql",
	schema: "./schema.ts",
	out: "./migrations"
})

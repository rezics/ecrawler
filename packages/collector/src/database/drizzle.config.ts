import {DatabaseConfig} from "@ecrawler/core/database/config.ts"
import {defineConfig} from "drizzle-kit"
import {Config, Effect, Redacted} from "effect"
import {loadEnvFile} from "node:process"

loadEnvFile("../../.env.development")

const config = DatabaseConfig.pipe(Config.unwrap, Effect.runSync)

export default defineConfig({
	dbCredentials: {url: Redacted.value(config.url)},
	dialect: "postgresql",
	schema: "./schema.ts",
	out: "./migrations"
})

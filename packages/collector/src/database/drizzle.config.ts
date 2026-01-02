import {DatabaseConfig} from "@ecrawler/core/database/config.ts"
import {defineConfig} from "drizzle-kit"
import {Context, Effect, Layer, Redacted} from "effect"

const config = DatabaseConfig.Default.pipe(
	Layer.build,
	Effect.scoped,
	Effect.runSync,
	Context.get(DatabaseConfig)
)

export default defineConfig({
	dbCredentials: {
		url: Redacted.value(config.url)
	},
	dialect: "postgresql",
	schema: "./schema.ts",
	out: "./migrations"
})

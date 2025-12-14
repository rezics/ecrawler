import {Config, Redacted} from "effect"

export const baseConfig = Config.all({
	host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
	databaseUrl: Config.redacted("DATABASE_URL")
})

export interface BaseServiceConfig {
	readonly host: string
	readonly port: number
	readonly databaseUrl: Redacted.Redacted<string>
}

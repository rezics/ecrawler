import {defineConfig} from "drizzle-kit"

export default defineConfig({
  dialect: "turso",
  schema: "./schema.ts",
  out: "./migrations",
  dbCredentials: {url: process.env.DATABASE_URL ?? "file:./local.db"}
})

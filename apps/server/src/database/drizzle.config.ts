import {defineConfig} from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: "./schemas/NetworkProxyError.ts",
  out: "./migrations",
  driver: "pglite",
  dbCredentials: {url: "memory://"}
})

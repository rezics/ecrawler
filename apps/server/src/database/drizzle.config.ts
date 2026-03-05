import {defineConfig} from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: "./schemas/index.ts",
  out: "./migrations",
  driver: "pglite",
  dbCredentials: {url: "memory://"}
})

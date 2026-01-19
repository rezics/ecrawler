import {$, cd, os, path, syncProcessCwd, within} from "zx"
import fs from "node:fs/promises"
import {stdout} from "node:process"
import {Task} from "@ecrawler/schemas/task"

const title = (text: string) => console.log(`\n\n${"-".repeat(7)} ${text} ${"-".repeat(7)}\n\n`)

const TaskInput = Task.pick("tags", "link")

export const test = async (tasks: (typeof TaskInput.Type)[], workers: string[]) => {
	syncProcessCwd()

	const root = $.env["PROJECT_CWD"]
	if (!root) {
		throw new Error("PROJECT_CWD is not set")
	}
	cd(root)

	const decoder = new TextDecoder()

	// Auth tokens for testing
	const DISPATCHER_TOKEN = "e2e-dispatcher-token"
	const COLLECTOR_TOKEN = "e2e-collector-token"

	title("DATABASE")
	const DATABASE_CONTAINER_NAME = "ecrawler-e2e-database"
	const DATABASE_USERNAME = "postgres"
	const DATABASE_PASSWORD = "postgres"
	const DATABASE_PORT = 25432
	const DATABASE_INIT = ["CREATE DATABASE dispatcher;", "CREATE DATABASE collector;"].join("\n")
	await within(async () => {
		cd("./tools/database")
		await $`podman stop ${DATABASE_CONTAINER_NAME}`.quiet().nothrow()
		await $`podman rm ${DATABASE_CONTAINER_NAME}`.quiet().nothrow()

		const filename = path.join(os.tmpdir(), `ecrawler-e2e-database-init-${performance.now()}.sql`)
		await fs.writeFile(filename, DATABASE_INIT, {encoding: "utf-8", mode: "777"})

		const task =
			$`podman run --rm --name ${DATABASE_CONTAINER_NAME} -p 127.0.0.1:${DATABASE_PORT}:5432 --env POSTGRES_USER=${DATABASE_USERNAME} --env POSTGRES_PASSWORD=${DATABASE_PASSWORD} -v ${filename}:/docker-entrypoint-initdb.d/init.sql:Z postgres:18`.nothrow()

		task.pipe(stdout)
		for await (const line of task.stderr) {
			const text = decoder.decode(line)
			if (text.includes("listening on Unix socket")) {
				break
			}
		}
	})

	title("DISPATCHER")
	const DISPATCHER_HOST = "127.0.0.1"
	const DISPATCHER_PORT = "22333"
	await within(async () => {
		cd("./apps/dispatcher")
		$.env["HOST"] = DISPATCHER_HOST
		$.env["PORT"] = DISPATCHER_PORT
		$.env["DATABASE_URL"] =
			`postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@127.0.0.1:${DATABASE_PORT}/dispatcher`
		const task = $`yarn run -T tsx ./src/main.ts`

		await new Promise<void>(resolve => {
			task.stdout.on("data", chunk => {
				stdout.write(chunk)
				const text = decoder.decode(chunk)
				if (text.includes(DISPATCHER_PORT)) {
					resolve()
				}
			})
		})
	})
	await $`podman exec ${DATABASE_CONTAINER_NAME} psql -U ${DATABASE_USERNAME} -d dispatcher -c "INSERT INTO token (data) VALUES ('${DISPATCHER_TOKEN}');"`.quiet()

	title("COLLECTOR")
	const COLLECTOR_HOST = "127.0.0.1"
	const COLLECTOR_PORT = "22334"
	await within(async () => {
		cd("./apps/collector")
		$.env["HOST"] = COLLECTOR_HOST
		$.env["PORT"] = COLLECTOR_PORT
		$.env["DATABASE_URL"] =
			`postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@127.0.0.1:${DATABASE_PORT}/collector`
		const task = $`yarn run -T tsx ./src/main.ts`

		await new Promise<void>(resolve => {
			task.stdout.on("data", chunk => {
				stdout.write(chunk)
				const text = decoder.decode(chunk)
				if (text.includes(COLLECTOR_PORT)) {
					resolve()
				}
			})
		})
	})
	await $`podman exec ${DATABASE_CONTAINER_NAME} psql -U ${DATABASE_USERNAME} -d collector -c "INSERT INTO token (data) VALUES ('${COLLECTOR_TOKEN}');"`.quiet()

	title("IMPORT TASK")
	await within(async () => {
		cd("./apps/cli")

		const dispatcher = `http://${DISPATCHER_HOST}:${DISPATCHER_PORT}`

		const filename = path.join(os.tmpdir(), `ecrawler-e2e-tasks-${performance.now()}.json`)
		await fs.writeFile(filename, JSON.stringify(tasks, null, 2), "utf-8")

		const task = $`yarn start import -t ${DISPATCHER_TOKEN} -i ${filename} ${dispatcher}`
		task.pipe(stdout)
		await task
	})

	title("WORKER")
	await within(async () => {
		cd("./apps/worker")
		$.env["DISPATCHER_BASE_URL"] = `http://${DISPATCHER_HOST}:${DISPATCHER_PORT}`
		$.env["DISPATCHER_TOKEN"] = DISPATCHER_TOKEN
		$.env["COLLECTOR_BASE_URL"] = `http://${COLLECTOR_HOST}:${COLLECTOR_PORT}`
		$.env["COLLECTOR_TOKEN"] = COLLECTOR_TOKEN
		$.env["WORKERS"] = workers.join(",")
		const task = $`yarn run -T tsx ./src/main.ts`
		task.pipe(stdout)

		await task
	})
}

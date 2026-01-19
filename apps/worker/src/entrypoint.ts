import {$} from "zx"

const workers = $.env["WORKERS"]?.split(",")
if (!workers) {
	throw new Error("WORKERS environment variable is required")
}

const packages = Array.from(
	new Set(workers.map(worker => worker.split("/").slice(0, -1).join("/")))
)

await $`npm i -g ${packages.join(" ")}`

$.spawnSync("node", ["./main.mjs"])

import {$} from "zx"
import fs from "node:fs/promises"
import path from "node:path"

if (import.meta.main) {
	const self = import.meta.filename
	const dirname = path.dirname(self)

	for await (const name of fs.glob("**/*.ts", {cwd: dirname})) {
		const filename = path.join(dirname, name)
		if (filename === self) continue
		$.spawnSync("tsx", [filename], {stdio: "inherit"})
	}
}

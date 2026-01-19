import {$, cd} from "zx"
import pkg from "../../package.json" with {type: "json"}
import fs from "node:fs/promises"

const root = $.env["PROJECT_CWD"]
if (!root) {
	throw new Error("PROJECT_CWD is not set")
}
cd(root)

await fs.rm("README", {force: true})

const readme = []

readme.push(`Effective`, `Crawler @ ${pkg.version}`, "", await $`tree --gitignore --dirsfirst  --prune --du -h`)

await fs.writeFile("README", readme.join("\n"), "utf-8")

import {cd} from "zx"
import pkg from "../../package.json" with {type: "json"}
import fs from "node:fs/promises"

const root = process.env["PROJECT_CWD"]
if (!root) {
	throw new Error("PROJECT_CWD is not set")
}
cd(root)

await fs.rm("README", {force: true})

const readme = []

readme.push(`Effective`, `Crawler @ ${pkg.version}`, "", `🄯 ${new Date().getFullYear()} NMNM.CC, REZICS`)

await fs.writeFile("README", readme.join("\n"), "utf-8")

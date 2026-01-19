import {$, cd} from "zx"
import pkg from "../../package.json" with {type: "json"}

type Update = "major" | "minor" | "patch"
type Version = `${number}.${number}.${number}`

const update = String(process.argv[2] as Update | undefined).toLowerCase()
if (!update) {
	throw new Error("Update type is required")
}
const current = pkg.version as Version
const [major, minor, patch] = current.split(".").map(Number)
if (
	major === undefined ||
	minor === undefined ||
	patch === undefined ||
	Number.isNaN(major) ||
	Number.isNaN(minor) ||
	Number.isNaN(patch)
) {
	throw new Error(`Invalid version format: ${current}`)
}

let next: Version
if (update === "major") {
	next = `${major + 1}.0.0`
} else if (update === "minor") {
	next = `${major}.${minor + 1}.0`
} else {
	next = `${major}.${minor}.${patch + 1}`
}

const root = $.env["PROJECT_CWD"]
if (!root) {
	throw new Error("PROJECT_CWD is not set")
}
cd(root)

await $`yarn version -i ${next}`
await $`yarn workspaces foreach -A version -i ${next}`

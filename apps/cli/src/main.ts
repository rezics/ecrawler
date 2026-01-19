import {Command} from "@effect/cli"
import pkg from "../package.json" with {type: "json"}
import {Import} from "./commands/import.ts"
import {Export} from "./commands/export.ts"
import {NodeContext, NodeHttpClient, NodeRuntime} from "@effect/platform-node"
import {Effect, Layer} from "effect"

const program = Command.run(
	Command.make("ecrawler").pipe(Command.withSubcommands([Import, Export])),
	{name: pkg.name, version: pkg.version}
)

program(process.argv).pipe(
	Effect.provide(Layer.mergeAll(NodeContext.layer, NodeHttpClient.layer)),
	NodeRuntime.runMain
)

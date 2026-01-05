import {Effect, Layer} from "effect"
import api from "./api/index.ts"
import {DatabaseLive} from "./database/client.ts"
import {NodeRuntime} from "@effect/platform-node"

const ApiLayer = api.pipe(Layer.provide(DatabaseLive))

const program = Effect.gen(function* () {
	yield* Effect.log("Starting Dispatcher Server...")

	return yield* Layer.launch(ApiLayer).pipe(
		Effect.ensuring(Effect.log("Shutting down Dispatcher Server..."))
	)
})

NodeRuntime.runMain(program)

import "dotenv/config"
import {Effect, Layer} from "effect"
import Api from "./api/index.ts"
import {Database} from "./database/index.ts"
import {LeaseReaper} from "./services/LeaseReaper.ts"
import {NodeContext, NodeRuntime} from "@effect/platform-node"

const ApiLayer = Api.pipe(
  Layer.provide(LeaseReaper.Default),
  Layer.provide(Database.layer),
  Layer.provide(NodeContext.layer)
)

const program = Effect.gen(function* () {
  yield* Effect.log("Starting Server...")

  return yield* Layer.launch(ApiLayer).pipe(
    Effect.ensuring(Effect.log("Shutting down Server..."))
  )
})

NodeRuntime.runMain(program)

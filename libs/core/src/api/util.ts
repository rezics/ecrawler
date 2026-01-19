import {HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup, OpenApi} from "@effect/platform"
import {Effect, Schema} from "effect"
import {UnknownError} from "./error"

const Api = HttpApi.make("util")
  .add(
    HttpApiGroup.make("system", {topLevel: true}).add(
      HttpApiEndpoint.head("health")`/health`
        .addSuccess(Schema.Void)
        .annotate(OpenApi.Summary, "Check health status")
        .annotate(OpenApi.Description, "Checks if the service is healthy\n\n检查服务是否健康")
    )
  )
  .addError(UnknownError)

export default Api

export const system = HttpApiBuilder.group(Api, "system", handlers =>
  handlers.handle("health", () => Effect.succeed(void {}))
)

import {Context, Effect, Layer} from "effect"
import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse
} from "@effect/platform"
import {RateLimited, ServerError, Unauthorized} from "../../errors/index.ts"
import type {NetworkProxyError} from "../../errors/index.ts"
import type {ProxyRequest} from "../../types/Proxy/ProxyRequest"
import {WebShareConfig} from "./Config"
import {WebShareProxyList} from "./Schemas"

const mapError = (status: number, body: unknown): NetworkProxyError => {
  if (status === 401) return new Unauthorized()
  if (status === 429) return new RateLimited()
  return new ServerError({cause: body})
}

export interface WebShareClientShape {
  readonly list: (
    page: number,
    request: ProxyRequest
  ) => Effect.Effect<typeof WebShareProxyList.Type, NetworkProxyError>
}

export class WebShareClient extends Context.Tag(
  "@ecrawler/proxy/NetworkProxy/WebShare/Client"
)<WebShareClient, WebShareClientShape>() {
  static readonly layer = Layer.effect(
    WebShareClient,
    Effect.gen(function* () {
      const http = yield* HttpClient.HttpClient
      const config = yield* WebShareConfig

      const list = (
        page: number,
        request: ProxyRequest
      ): Effect.Effect<typeof WebShareProxyList.Type, NetworkProxyError> => {
        const params: Record<string, string> = {
          mode: "direct",
          page: String(page),
          page_size: request.limit
            ? String(Math.min(request.limit, config.pageSize))
            : config.pageSize.toString()
        }
        if (request.country) params["country_code__in"] = request.country

        const url = `${config.baseUrl}/api/v2/proxy/list/?${new URLSearchParams(params).toString()}`

        return HttpClientRequest.get(url).pipe(
          HttpClientRequest.setHeader(
            "Authorization",
            `Token ${config.apiToken}`
          ),
          http.execute,
          Effect.flatMap(response => {
            if (response.status === 200) {
              return HttpClientResponse.schemaBodyJson(WebShareProxyList)(
                response
              ).pipe(Effect.mapError(e => new ServerError({cause: e})))
            }
            return response.json.pipe(
              Effect.orElseSucceed(() => null),
              Effect.flatMap(body =>
                Effect.fail(mapError(response.status, body))
              )
            )
          }),
          Effect.mapError(
            (e): NetworkProxyError =>
              e instanceof HttpClientError.RequestError ||
              e instanceof HttpClientError.ResponseError
                ? new ServerError({cause: e})
                : e
          ),
          Effect.scoped
        )
      }

      return {list}
    })
  )
}

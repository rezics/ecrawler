import {Context, Effect, Layer} from "effect"
import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse
} from "@effect/platform"
import {
  RateLimited,
  ServerError,
  Unauthorized
} from "../../src/NetworkProxyError"
import type {All} from "../../src/NetworkProxyError"
import type {ProxyRequest} from "../../src/NetworkProxy"
import {WebShareConfig} from "./Config"
import {WebShareProxyList} from "./Schemas"

const mapError = (status: number, body: unknown): All => {
  if (status === 401) return new Unauthorized()
  if (status === 429) return new RateLimited()
  return new ServerError({cause: body})
}

export interface WebShareClientShape {
  /**
   * 获取代理列表
   *
   * 返回值包含 `count`（总数）和 `next`（下一页 URL，若为 `null` 则表示没有下一页）
   */
  readonly list: (
    page: number,
    request: ProxyRequest
  ) => Effect.Effect<typeof WebShareProxyList.Type, All>
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
      ): Effect.Effect<typeof WebShareProxyList.Type, All> => {
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
            (e): All =>
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

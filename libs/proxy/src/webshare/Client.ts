import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse
} from "@effect/platform"
import {Effect, Layer, Option, Schedule} from "effect"
import {Schema} from "effect"
import {Proxy, type ProxyType} from "../schema/index.js"
import {WebshareConfig} from "./Config.js"
import {WebshareApiError} from "../errors.js"

const BaseUrl = "https://proxy.webshare.io"

const ProxyListResponse = Schema.Struct({
  results: Schema.Array(Proxy),
  next: Schema.NullOr(Schema.String)
})

export const ProxyConfig = Schema.Struct({
  username: Schema.String,
  password: Schema.String,
  proxy_list_download_token: Schema.String
})

export const ProxyStatus = Schema.Struct({
  state: Schema.Union(
    Schema.Literal("pending"),
    Schema.Literal("processing"),
    Schema.Literal("completed")
  )
})

const retry429 = Schedule.exponential("1 second").pipe(
  Schedule.upTo("30 seconds")
)

function runRequest<A, I, R>(
  client: HttpClient.HttpClient,
  url: string,
  schema: Schema.Schema<A, I, R>
): Effect.Effect<A, WebshareApiError, R> {
  const attempt = Effect.gen(function* () {
    const res = yield* client.get(url)
    if (res.status >= 200 && res.status < 300) {
      return yield* HttpClientResponse.schemaBodyJson(schema)(res)
    }
    const body = yield* res.text
    return yield* Effect.fail(new WebshareApiError({status: res.status, body}))
  }).pipe(
    Effect.catchTag("ResponseError", e =>
      Effect.gen(function* () {
        const body = yield* e.response.text
        return yield* Effect.fail(
          new WebshareApiError({status: e.response.status, body})
        )
      })
    ),
    Effect.catchAll(e =>
      Effect.fail(
        e._tag === "WebshareApiError"
          ? e
          : new WebshareApiError({
              status: 0,
              body: e instanceof Error ? e.message : String(e)
            })
      )
    )
  )
  return attempt.pipe(Effect.retry(retry429))
}

export interface ListProxiesFilter {
  readonly valid?: boolean
  readonly country_code?: string
}

export class WebshareClient extends Effect.Tag("WebshareClient")<
  WebshareClient,
  {
    readonly listProxies: (
      filter?: ListProxiesFilter
    ) => Effect.Effect<ReadonlyArray<ProxyType>, WebshareApiError>
    readonly getConfig: () => Effect.Effect<
      Schema.Schema.Type<typeof ProxyConfig>,
      WebshareApiError
    >
    readonly getStatus: () => Effect.Effect<
      Schema.Schema.Type<typeof ProxyStatus>,
      WebshareApiError
    >
  }
>() {
  static readonly Default = Layer.scoped(
    WebshareClient,
    Effect.gen(function* () {
      const config = yield* WebshareConfig
      const client = yield* HttpClient.HttpClient.pipe(
        Effect.map(
          HttpClient.mapRequest(
            HttpClientRequest.setHeader(
              "Authorization",
              `Token ${config.apiKey}`
            )
          )
        )
      )

      const listProxies = (filter?: ListProxiesFilter) =>
        Effect.gen(function* () {
          const params = new URLSearchParams({mode: "direct", page_size: "100"})
          if (filter?.valid === true) params.set("valid", "true")
          if (filter?.country_code !== undefined)
            params.set("country_code__in", filter.country_code)

          const collect = (
            url: string,
            acc: Array<ProxyType>
          ): Effect.Effect<ReadonlyArray<ProxyType>, WebshareApiError> =>
            Effect.gen(function* () {
              const decoded = yield* runRequest(client, url, ProxyListResponse)
              const nextAcc = [...acc, ...decoded.results]
              if (decoded.next === null) return nextAcc
              return yield* collect(decoded.next, nextAcc)
            })

          return yield* collect(
            `${BaseUrl}/api/v2/proxy/list/?${params.toString()}`,
            []
          )
        })

      const getConfig = () =>
        Effect.gen(function* () {
          const planParam = Option.match(config.planId, {
            onNone: () => "",
            onSome: id => `?plan_id=${encodeURIComponent(id)}`
          })
          return yield* runRequest(
            client,
            `${BaseUrl}/api/v3/proxy/config${planParam}`,
            ProxyConfig
          )
        })

      const getStatus = () =>
        runRequest(client, `${BaseUrl}/api/v3/proxy/list/status`, ProxyStatus)

      return WebshareClient.of({listProxies, getConfig, getStatus})
    })
  )
}

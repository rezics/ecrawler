import {Schema} from "effect"

export class WebshareApiError extends Schema.TaggedError<WebshareApiError>()(
  "WebshareApiError",
  {status: Schema.Number, body: Schema.String}
) {}

export class ProxyPoolEmptyError extends Schema.TaggedError<ProxyPoolEmptyError>()(
  "ProxyPoolEmptyError",
  {}
) {}

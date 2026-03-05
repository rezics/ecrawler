import {Schema} from "effect"

export class WebShareProxy extends Schema.Class<WebShareProxy>("WebShareProxy")(
  {
    id: Schema.String,
    username: Schema.String,
    password: Schema.String,
    proxy_address: Schema.String,
    port: Schema.Number,
    valid: Schema.Boolean,
    country_code: Schema.String,
    city_name: Schema.NullOr(Schema.String),
    created_at: Schema.String
  }
) {}

export class WebShareProxyList extends Schema.Class<WebShareProxyList>(
  "WebShareProxyList"
)(
  {
    count: Schema.Number,
    next: Schema.NullOr(Schema.String),
    previous: Schema.NullOr(Schema.String),
    results: Schema.Array(WebShareProxy)
  }
) {}

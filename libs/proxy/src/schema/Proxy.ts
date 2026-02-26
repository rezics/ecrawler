import {Schema} from "effect"

export class Proxy extends Schema.Class<Proxy>("Proxy")({
  id: Schema.String,
  username: Schema.String,
  password: Schema.String,
  proxy_address: Schema.String,
  port: Schema.Number,
  valid: Schema.Boolean,
  country_code: Schema.String,
  city_name: Schema.optionalWith(Schema.String, {default: () => ""})
}) {}

export type ProxyType = InstanceType<typeof Proxy>

import {HttpApiMiddleware, HttpApiSecurity} from "@effect/platform"
import {Schema} from "effect"
import {UnknownError} from "../error.ts"

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
  message: Schema.String
}) {}

export class Auth extends HttpApiMiddleware.Tag<Auth>()("AuthMiddleware", {
  optional: false,
  failure: Schema.Union(AuthError, UnknownError),
  security: {bearer: HttpApiSecurity.bearer}
}) {}

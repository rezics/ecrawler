import {program} from "@ecrawler/worker"
import {Scaler} from "@ecrawler/worker/services/Scaler.ts"
import {Client} from "@ecrawler/worker/services/Client.ts"
import {WorkerConfig} from "@ecrawler/worker/services/WorkerConfig.ts"
import {NodeHttpClient, NodeRuntime} from "@effect/platform-node"
import {Effect, Layer} from "effect"
import {BQGLExtractor} from "./Extractor.ts"
import {
  WebShare,
  WebShareConfig,
  WebShareClient
} from "@ecrawler/proxy-webshare"

const Live = Layer.mergeAll(
  BQGLExtractor,
  Scaler.EMA.pipe(Layer.provide(Scaler.EMAConfig.Default)),
  Client.Default,
  WebShareClient.layer,
  WebShare,
  WebShareConfig.layer
).pipe(Layer.provide(WorkerConfig.Default), Layer.provide(NodeHttpClient.layer))

// @ts-expect-error - Layer type inference workaround
program.pipe(Effect.provide(Live), NodeRuntime.runMain)

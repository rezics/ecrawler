import {program} from "@ecrawler/worker"
import {Scaler} from "@ecrawler/worker/services/Scaler.ts"
import {Client} from "@ecrawler/worker/services/Client.ts"
import {WorkerConfig} from "@ecrawler/worker/services/WorkerConfig.ts"
import {NodeHttpClient, NodeRuntime} from "@effect/platform-node"
import {Effect, Layer} from "effect"
import {BQGLExtractor} from "./Extractor.ts"

const Live = Layer.mergeAll(
  BQGLExtractor,
  Scaler.EMA.pipe(Layer.provide(Scaler.EMAConfig.Default)),
  Client.Default
).pipe(Layer.provide(WorkerConfig.Default), Layer.provide(NodeHttpClient.layer))

program.pipe(Effect.provide(Live), NodeRuntime.runMain)

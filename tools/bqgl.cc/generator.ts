import {Array, pipe, String, Tuple} from "effect"

pipe(
  [process.argv[2], process.argv[3]] as const,
  Tuple.map(parseInt),
  ([from, to]) => new globalThis.Array(to).fill(0).map((_, i) => i + from),
  Array.map(n => `https://www.bqgl.cc/look/${n}/`),
  JSON.stringify,
  console.log
)

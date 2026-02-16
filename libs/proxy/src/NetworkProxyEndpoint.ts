export type NetworkProxyEndpointType = "sticky" | "rotating"

export type NetworkProxyMetadata<T extends NetworkProxyEndpointType> = {
  provider: string
  location: string
} & (T extends "sticky"
  ? {sticky: {}}
  : T extends "rotating"
    ? {rotating: {expiredAt: Date}}
    : never)

export class NetworkProxyEndpoint<
  T extends NetworkProxyEndpointType
> extends URL {
  public readonly metadata: NetworkProxyMetadata<T>

  constructor(
    ...params: [...ConstructorParameters<typeof URL>, NetworkProxyMetadata<T>]
  ) {
    const metadata = params.pop() as NetworkProxyMetadata<T>
    // @ts-expect-error
    super(...params)
    this.metadata = metadata
  }
}

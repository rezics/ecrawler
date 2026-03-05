/**
 * Constraints for requesting a proxy (intersection of provider capabilities).
 * Provider-specific params are not part of this type.
 */
export interface ProxyRequest {
  readonly country?: string
  readonly limit?: number
}

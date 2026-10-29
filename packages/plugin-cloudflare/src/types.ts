export type CloudflarePluginOptions = {
  /**
   * Apply the Workers compatibility defaults in all environments, including local development.
   * @default true
   */
  enabled?: boolean
  /**
   * Use a console-based logger when the Payload config does not supply one.
   * @default true
   */
  useConsoleLogger?: boolean
  /**
   * Default upload collections to native fetch instead of Payload's SSRF-filtering fetch.
   * Only enable when outbound access is restricted to trusted destinations by the deployment.
   * Explicit collection-level `skipSafeFetch` settings take precedence.
   * @default false
   */
  useNativeFetch?: boolean
}

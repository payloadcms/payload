/**
 * Whether React Server Components are supported in the current environment.
 * Controlled by the `PAYLOAD_FRAMEWORK_RSC_ENABLED` environment variable.
 *
 * - `PAYLOAD_FRAMEWORK_RSC_ENABLED=true` → RSC is available (set by Next.js `withPayload` and
 *   TanStack Start's `payloadPlugin` via `@vitejs/plugin-rsc`)
 * - `PAYLOAD_FRAMEWORK_RSC_ENABLED=false` → RSC is NOT available
 *
 * Defaults to `true` when the variable is not set.
 */
export function isRSCEnabled(): boolean {
  return process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED !== 'false'
}

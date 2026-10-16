/**
 * Modules the prebuilt runtime shares with separately compiled custom components. Each environment
 * registers lazy loaders for its own instances, so a custom component's `import { useField } from
 * '@payloadcms/ui'` reaches the same React contexts as the admin it renders in.
 */
export type SharedEnvironment = 'browser' | 'rsc' | 'ssr'

export type SharedRegistry = Record<string, () => Promise<Record<string, unknown>>>

declare global {
  var __payload_shared__: Partial<Record<SharedEnvironment, SharedRegistry>> | undefined
  /** The host's `payload` modules, set by `src/index.ts`. */
  var __payload_host__: Record<string, unknown> | undefined
  /** The environment the server renders into the page (see entry.ssr.tsx). */
  var __PAYLOAD_ENV__: Record<string, string> | undefined
}

export const registerShared = (env: SharedEnvironment, registry: SharedRegistry) => {
  globalThis.__payload_shared__ = { ...globalThis.__payload_shared__, [env]: registry }
}

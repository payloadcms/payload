import type { PluginOption } from 'vite'

/**
 * Stubs `prettier` in the CLIENT bundle only.
 *
 * `payload`'s barrel transitively pulls `json-schema-to-typescript` → `prettier`
 * (CommonJS) into the client graph. That path is type-gen only and never runs in
 * the browser, but the bundler still drags in `prettier`'s `index.cjs`, which
 * fails to parse as ESM and breaks the client build. SSR/RSC keep real prettier.
 *
 * Delete once `payload`'s barrel no longer reaches type-gen from the client graph.
 */
export function stubPrettierInClient(): PluginOption {
  const RESOLVED_ID = '\0payload:prettier-client-stub'

  return {
    name: 'payload:stub-prettier-in-client',
    enforce: 'pre',
    load(id) {
      if (id === RESOLVED_ID) {
        return 'export const format = (source) => source;\nexport default { format };'
      }
    },
    resolveId(id, importer, options) {
      if (options?.ssr) {
        return
      }
      // Only stub the type-gen import; leave a host's own client `prettier` alone.
      if (id === 'prettier' && importer?.includes('json-schema-to-typescript')) {
        return RESOLVED_ID
      }
    },
  }
}

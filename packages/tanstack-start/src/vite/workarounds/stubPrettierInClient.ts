import type { PluginOption } from 'vite'

/**
 * Stubs `prettier` in the CLIENT bundle only.
 *
 * `payload`'s barrel transitively pulls `configToJSONSchema` →
 * `json-schema-to-typescript` → `prettier` (CommonJS) into the client module
 * graph through re-export side effects. That path is type-generation only
 * (`payload generate:types`) and never runs in the browser, but the bundler
 * still drags `prettier`'s `index.cjs` in — where it fails to parse as ESM and
 * breaks the client build.
 *
 * We redirect `prettier` to a no-op `format` stub in the client environment
 * only. SSR/RSC keep the real `prettier` (there `json-schema-to-typescript`
 * stays external and resolves it from `node_modules`), and the `prettier` CLI /
 * `payload generate:types` are unaffected.
 *
 * Delete this once `payload`'s barrel no longer reaches the type-gen path from
 * the client-reachable export graph.
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
    resolveId(id, _importer, options) {
      if (options?.ssr) {
        return
      }
      if (id === 'prettier') {
        return RESOLVED_ID
      }
    },
  }
}

import { mergeConfig } from 'vite'

import base from './vite.tanstack.config.js'

/**
 * Production build config for the TanStack admin app. Wraps the shared dev
 * config with the overrides needed to produce a real `vite build` output:
 *
 * - `cssMinify: 'esbuild'` — the default `lightningcss` minifier throws on the
 *   nested `@keyframes` that Payload's SCSS emits (`Unknown at rule:
 *   @keyframes`). esbuild minifies the same CSS without complaint.
 * - `emptyOutDir: true` — the client env writes to `dist/app-tanstack` which is
 *   outside the Vite root (`test/`), so Vite refuses to clean it by default.
 */
export default async (env: any) => {
  const resolved = typeof base === 'function' ? await (base as any)(env) : base
  return mergeConfig(resolved, {
    build: {
      cssMinify: 'esbuild',
      emptyOutDir: true,
    },
  })
}

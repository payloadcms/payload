import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)

/**
 * SCSS `@import`/`@use` importers applied for every Payload consumer.
 *
 * Resolves webpack-style `~@payloadcms/...` tilde specifiers (emitted by
 * first-party Payload package styles, e.g. `@payloadcms/richtext-slate`) to the
 * installed package via Node resolution. Because it goes through the package's
 * `exports` map, it picks the workspace `src` scss in the monorepo and the
 * published `dist` scss in a consumer install automatically — no per-app
 * `findFileUrl` shim needed.
 */
export const payloadScssImporters = [
  {
    findFileUrl(url: string): null | URL {
      if (!url.startsWith('~@payloadcms/')) {
        return null
      }
      try {
        return pathToFileURL(require.resolve(url.slice(1)))
      } catch {
        return null
      }
    },
  },
]

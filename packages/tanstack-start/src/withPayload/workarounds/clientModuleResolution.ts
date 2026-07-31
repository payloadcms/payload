import type { PluginOption } from 'vite'

import fs from 'node:fs'
import path from 'node:path'

/**
 * Client-side module resolution:
 * 1. Stubs RSC modules (`@payloadcms/.../rsc`) with no-op components so the
 *    Vite optimizer never tries to bundle their server implementations.
 * 2. Redirects bare `payload` imports made from user code (outside of
 *    `node_modules` and our own packages) to `payload/shared`. The main
 *    `payload` entry has top-level side effects requiring Node.js APIs.
 * 3. Resolves `/client` subpath exports for `@payloadcms/plugin-*` and
 *    `@payloadcms/storage-*` packages when normal Vite resolution fails in
 *    monorepo dev (no `dist/` built yet).
 */
export function clientModuleResolution(): PluginOption {
  const stubPrefix = '\0payload:server-stub:'

  const serverOnlyPatterns: RegExp[] = [
    /^@payloadcms\/richtext-lexical\/rsc$/,
    /^@payloadcms\/richtext-slate\/rsc$/,
    /^@payloadcms\/next\/rsc$/,
    /^@payloadcms\/tanstack-start\/rsc$/,
  ]

  const serverOnlyExports: Record<string, string[]> = {
    '@payloadcms/next/rsc': ['CollectionCards', 'HierarchyTypeFieldServer'],
    '@payloadcms/richtext-lexical/rsc': [
      'RscEntryLexicalCell',
      'RscEntryLexicalField',
      'LexicalDiffComponent',
    ],
    '@payloadcms/tanstack-start/rsc': [
      'CollectionCards',
      'HierarchyTypeFieldServer',
      'renderPayloadComponentOnServer',
    ],
  }

  return {
    name: 'payload:client-module-resolution',
    enforce: 'pre',
    load(id) {
      if (!id.startsWith(stubPrefix)) {
        return
      }
      const specifier = id.slice(stubPrefix.length)
      const exports = serverOnlyExports[specifier]
      if (exports) {
        return exports.map((name) => `export const ${name} = () => null;`).join('\n')
      }
      return `export default null;`
    },
    async resolveId(id, importer, options) {
      if (options?.ssr) {
        return
      }

      if (serverOnlyPatterns.some((p) => p.test(id))) {
        return stubPrefix + id
      }

      if (id === 'payload' && importer && !importer.includes('/node_modules/')) {
        const isPayloadPackage = /\/packages\/(?:payload|ui|richtext-|tanstack-start|next)\//.test(
          importer,
        )
        if (!isPayloadPackage) {
          return this.resolve('payload/shared', importer, { ...options, skipSelf: true })
        }
      }

      if (/^@payloadcms\/(?:plugin|storage)-[^/]+\/client$/.test(id)) {
        const resolved = await this.resolve(id, importer, { ...options, skipSelf: true })
        if (resolved) {
          return resolved
        }
        const pkgName = id.replace(/\/client$/, '')
        const pkgResolved = await this.resolve(pkgName, importer, { ...options, skipSelf: true })
        if (pkgResolved) {
          const pkgDir = path.dirname(pkgResolved.id)
          const candidates = [
            path.resolve(pkgDir, 'src', 'exports', 'client.ts'),
            path.resolve(pkgDir, 'src', 'exports', 'client.js'),
            path.resolve(pkgDir, 'dist', 'exports', 'client.js'),
          ]
          for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
              return candidate
            }
          }
        }
      }
    },
  }
}

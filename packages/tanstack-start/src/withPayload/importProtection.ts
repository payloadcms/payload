import { builtinModules } from 'node:module'

/**
 * Specifiers that must never appear in the client module graph. These are the
 * server-only Payload entry points plus Node.js built-ins and a handful of
 * Node-only npm packages that Payload pulls in transitively.
 */
export const serverOnlyClientSpecifiers: Array<RegExp | string> = [
  /^node:/,
  new RegExp(`^(${builtinModules.join('|')})(\\/|$)`),
  '@payload-config',
  /^@payloadcms\/next\/rsc/,
  /^@payloadcms\/richtext-lexical\/rsc/,
  /^@payloadcms\/richtext-slate\/rsc/,
  '@payloadcms/ui/server',
  /^@payloadcms\/tanstack-start\/(layouts|rsc|server|views\/server)/,
  'sharp',
  'busboy',
  'croner',
  'pino',
  'pino-pretty',
  'prompts',
  'ws',
  'undici',
  'get-tsconfig',
  /^file-type/,
  /^react-dom\/server/,
]

/**
 * Allowlist callback for the `tanstackStart` plugin's import-protection. These
 * are the legitimate cross-environment imports in our monorepo that we want
 * to permit even when they appear to cross a server/client boundary.
 */
export function onImportProtectionViolation(violation: unknown): boolean | void {
  const info = violation as {
    envType: 'client' | 'server'
    importer: string
    resolved?: string
  }

  const allowedClientFileImporters =
    /\/richtext-lexical\/.*\/exports\/client\/|\/tanstack-start\/.*\/views\/AdminView|\/ui\//

  if (
    info.envType === 'server' &&
    info.resolved?.includes('.client.') &&
    allowedClientFileImporters.test(info.importer)
  ) {
    return false
  }

  if (info.importer.includes('/richtext-lexical/') && info.importer.includes('/field/Diff/')) {
    return false
  }

  if (info.importer.includes('/packages/payload/') || info.importer.includes('/payload/dist/')) {
    return false
  }

  if (
    info.importer.includes('@payloadcms/ui') &&
    (info.importer.includes('/exports/rsc/') || info.importer.includes('/rsc/index'))
  ) {
    return false
  }

  if (info.envType === 'server' && info.importer.includes('vite-rsc/client-references')) {
    return false
  }
}

export const defaultImportProtectionIgnoreImporters: RegExp[] = [/^src\/importMap\.js(?:\?.*)?$/]

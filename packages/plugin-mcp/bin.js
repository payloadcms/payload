#!/usr/bin/env node
/**
 * stdio MCP server for Payload.
 *
 * Loads the project's `payload.config.{ts,js}` (via `findConfig`), boots Payload,
 * and serves MCP over stdin/stdout. Intended for local-dev MCP clients (Claude
 * Desktop, IDEs) that spawn stdio MCP servers - no running Next.js dev server required.
 *
 * Mirrors `payload/bin.js`: by default, transpiles TS on the fly via `tsx`. Pass
 * `--disable-transpile` if your config is already JS (or you've registered your
 * own loader).
 */
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const disableTranspile = process.argv.includes('--disable-transpile')

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const baseURL = pathToFileURL(dirname).toString() + '/'

const loadBin = async () => {
  if (disableTranspile) {
    process.argv = process.argv.filter((arg) => arg !== '--disable-transpile')
    return import('./dist/bin/index.js')
  }

  // tsx 4.22.4's synchronous loader leaks its namespace query onto Node built-ins on Node 23.5+.
  // Force the stable asynchronous loader path, matching payload/bin.js.
  const nodeModule = await import('node:module')
  if (typeof nodeModule.default.registerHooks === 'function') {
    nodeModule.default.registerHooks = undefined
  }

  const { tsImport } = await import('tsx/esm/api')
  return tsImport('@payloadcms/plugin-mcp/bin', baseURL)
}

const start = async () => {
  const { bin } = await loadBin()
  await bin()
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[payload-mcp] error:', err)
  process.exit(1)
})

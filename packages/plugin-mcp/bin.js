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
const disableTranspile = process.argv.includes('--disable-transpile')

const start = async () => {
  if (disableTranspile) {
    process.argv = process.argv.filter((arg) => arg !== '--disable-transpile')
    const { runMcpStdio } = await import('./dist/stdio.js')
    await runMcpStdio()
    return
  }

  const { register } = await import('tsx/esm/api')
  register()

  const { runMcpStdio } = await import('./dist/stdio.js')
  await runMcpStdio()
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[payload-mcp] error:', err)
  process.exit(1)
})

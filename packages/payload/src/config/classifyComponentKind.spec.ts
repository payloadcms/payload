import path from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

import { classifyComponentKind } from './classifyComponentKind.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, '__fixtures__')

describe('classifyComponentKind', () => {
  it('returns "client" for a module that begins with `\'use client\'`', async () => {
    const fixture = path.join(fixturesDir, 'client-only-component.tsx')
    await expect(classifyComponentKind({ componentPath: fixture })).resolves.toBe('client')
  })

  it('returns "client" when `\'use client\'` follows leading comments and blank lines', async () => {
    const fixture = path.join(fixturesDir, 'client-with-leading-comments.tsx')
    await expect(classifyComponentKind({ componentPath: fixture })).resolves.toBe('client')
  })

  it('returns "server" for a module that does not declare `\'use client\'`', async () => {
    const fixture = path.join(fixturesDir, 'server-only-component.ts')
    await expect(classifyComponentKind({ componentPath: fixture })).resolves.toBe('server')
  })

  it('returns "server" when the file cannot be resolved (defaults safe)', async () => {
    await expect(classifyComponentKind({ componentPath: '@/does/not/exist' })).resolves.toBe(
      'server',
    )
  })

  it('resolves baseDir-relative refs and falls back through .js → .tsx', async () => {
    // Mimics a config component ref: `./client-only-component.js#default` resolved
    // against `baseDir = __fixtures__`. The on-disk source is `.tsx`, so the
    // classifier must fan out the extension fallback.
    await expect(
      classifyComponentKind({
        baseDir: fixturesDir,
        componentPath: './client-only-component.js#default',
      }),
    ).resolves.toBe('client')
  })

  it('classifies a baseDir-relative ref to a server-only file', async () => {
    await expect(
      classifyComponentKind({
        baseDir: fixturesDir,
        componentPath: './server-only-component.js#default',
      }),
    ).resolves.toBe('server')
  })
})

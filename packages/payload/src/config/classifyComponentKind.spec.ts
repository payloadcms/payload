import { describe, it, expect } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import { classifyComponentKind } from './classifyComponentKind.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('classifyComponentKind', () => {
  it('returns "client" for a module that begins with `\'use client\'`', async () => {
    const fixture = path.join(__dirname, '__fixtures__', 'client-only-component.tsx')
    await expect(classifyComponentKind(fixture)).resolves.toBe('client')
  })

  it('returns "server" for a module that does not declare `\'use client\'`', async () => {
    const fixture = path.join(__dirname, '__fixtures__', 'server-only-component.ts')
    await expect(classifyComponentKind(fixture)).resolves.toBe('server')
  })

  it('returns "server" when the file cannot be resolved (defaults safe)', async () => {
    await expect(classifyComponentKind('@/does/not/exist')).resolves.toBe('server')
  })
})

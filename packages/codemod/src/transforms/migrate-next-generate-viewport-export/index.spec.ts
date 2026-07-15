import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateNextGenerateViewportExport } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-next-generate-viewport-export', () => {
  it('adds generateViewport re-export to app layouts that use Payloads shared viewport helper', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      filename: '/project/app/(payload)/layout.tsx',
      source: input,
      transform: migrateNextGenerateViewportExport,
    })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      filename: '/project/app/(payload)/layout.tsx',
      source: output,
      transform: migrateNextGenerateViewportExport,
    })

    expect(result).toBe(output)
  })

  it('no-ops when the layout defines a custom generateViewport export', async () => {
    const input = await fixture('non-matching.input.ts')
    const output = await fixture('non-matching.output.ts')

    const result = await runTransform({
      filename: '/project/app/(payload)/layout.tsx',
      source: input,
      transform: migrateNextGenerateViewportExport,
    })

    expect(result).toBe(output)
  })
})

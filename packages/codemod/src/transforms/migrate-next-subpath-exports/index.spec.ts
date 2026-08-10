import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateNextSubpathExports } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-next-subpath-exports', () => {
  it('rewrites import declarations and string component paths', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateNextSubpathExports })

    expect(result).toBe(output)
  })

  it('rewrites re-export declarations from the removed subpaths', async () => {
    const input = await fixture('re-export.input.ts')
    const output = await fixture('re-export.output.ts')

    const result = await runTransform({ source: input, transform: migrateNextSubpathExports })

    expect(result).toBe(output)
  })

  it('is idempotent on already-migrated source', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateNextSubpathExports })

    expect(result).toBe(output)
  })

  it('leaves unrelated imports and plain prose strings untouched', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({ source: input, transform: migrateNextSubpathExports })

    expect(result).toBe(input)
  })
})

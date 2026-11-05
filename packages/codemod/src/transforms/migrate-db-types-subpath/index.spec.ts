import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateDbTypesSubpath } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-db-types-subpath', () => {
  it('rewrites /types subpath imports to the main package entry point', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateDbTypesSubpath })

    expect(result).toBe(output)
  })

  it('rewrites declare module augmentations for /types subpaths', async () => {
    const input = await fixture('module-augmentation.input.ts')
    const output = await fixture('module-augmentation.output.ts')

    const result = await runTransform({ source: input, transform: migrateDbTypesSubpath })

    expect(result).toBe(output)
  })

  it('is idempotent on already-migrated source', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateDbTypesSubpath })

    expect(result).toBe(output)
  })

  it('leaves unrelated imports untouched', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({ source: input, transform: migrateDbTypesSubpath })

    expect(result).toBe(input)
  })
})

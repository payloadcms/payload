import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateAliasedExports } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-aliased-exports', () => {
  it('moves pass-through re-exports to canonical sources', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateAliasedExports })

    expect(result).toBe(output)
  })

  it('rewrites renamed types using `as` alias to preserve usages', async () => {
    const input = await fixture('rename.input.ts')
    const output = await fixture('rename.output.ts')

    const result = await runTransform({ source: input, transform: migrateAliasedExports })

    expect(result).toBe(output)
  })

  it('merges into existing import declaration from canonical source', async () => {
    const input = await fixture('merge.input.ts')
    const output = await fixture('merge.output.ts')

    const result = await runTransform({ source: input, transform: migrateAliasedExports })

    expect(result).toBe(output)
  })

  it('is idempotent on already-migrated source', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateAliasedExports })

    expect(result).toBe(output)
  })

  it('leaves unrelated imports untouched', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({ source: input, transform: migrateAliasedExports })

    expect(result).toBe(input)
  })
})

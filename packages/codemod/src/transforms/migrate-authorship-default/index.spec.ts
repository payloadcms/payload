import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateAuthorshipDefault } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-authorship-default', () => {
  it('adds authorship: false to CollectionConfig objects without an authorship property', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateAuthorshipDefault })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateAuthorshipDefault })

    expect(result).toBe(output)
  })

  it('does not modify collections that already have an authorship property', async () => {
    const input = await fixture('already-set.input.ts')
    const output = await fixture('already-set.output.ts')

    const result = await runTransform({ source: input, transform: migrateAuthorshipDefault })

    expect(result).toBe(output)
  })

  it('handles satisfies CollectionConfig form', async () => {
    const input = await fixture('satisfies.input.ts')
    const output = await fixture('satisfies.output.ts')

    const result = await runTransform({ source: input, transform: migrateAuthorshipDefault })

    expect(result).toBe(output)
  })

  it('is idempotent on satisfies output', async () => {
    const output = await fixture('satisfies.output.ts')

    const result = await runTransform({ source: output, transform: migrateAuthorshipDefault })

    expect(result).toBe(output)
  })

  it('adds authorship: false to GlobalConfig objects without an authorship property', async () => {
    const input = await fixture('globals.input.ts')
    const output = await fixture('globals.output.ts')

    const result = await runTransform({ source: input, transform: migrateAuthorshipDefault })

    expect(result).toBe(output)
  })

  it('is idempotent on globals output', async () => {
    const output = await fixture('globals.output.ts')

    const result = await runTransform({ source: output, transform: migrateAuthorshipDefault })

    expect(result).toBe(output)
  })

  it('no-ops on non-Collection/GlobalConfig objects', async () => {
    const input = await fixture('non-matching.input.ts')
    const output = await fixture('non-matching.output.ts')

    const result = await runTransform({ source: input, transform: migrateAuthorshipDefault })

    expect(result).toBe(output)
  })
})

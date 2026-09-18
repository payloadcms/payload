import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateSlugField } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-slug-field', () => {
  it('converts slugField() calls to native slug fields and removes the import', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateSlugField })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateSlugField })

    expect(result).toBe(output)
  })

  it('leaves a slugField() call using overrides untouched', async () => {
    const input = await fixture('overrides.input.ts')
    const output = await fixture('overrides.output.ts')

    const result = await runTransform({ source: input, transform: migrateSlugField })

    expect(result).toBe(output)
  })

  it('no-ops on code without slugField', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({ source: input, transform: migrateSlugField })

    expect(result).toBe(output)
  })
})

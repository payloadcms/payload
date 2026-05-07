import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateDisabledFields } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-disabled-fields', () => {
  it('migrates basic four-flag input', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateDisabledFields })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateDisabledFields })

    expect(result).toBe(output)
  })

  it('merges new keys into existing disabled object literal', async () => {
    const input = await fixture('merge.input.ts')
    const output = await fixture('merge.output.ts')

    const result = await runTransform({ source: input, transform: migrateDisabledFields })

    expect(result).toBe(output)
  })

  it('preserves disabled: true and drops redundant flags', async () => {
    const input = await fixture('preserve-true.input.ts')
    const output = await fixture('preserve-true.output.ts')

    const result = await runTransform({ source: input, transform: migrateDisabledFields })

    expect(result).toBe(output)
  })

  it('no-ops on code without old props', async () => {
    const input = await fixture('non-matching.input.ts')
    const output = await fixture('non-matching.output.ts')

    const result = await runTransform({ source: input, transform: migrateDisabledFields })

    expect(result).toBe(output)
  })
})

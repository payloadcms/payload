import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removeGroupByTrue } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('remove-group-by-true', () => {
  it('removes admin.groupBy regardless of boolean value', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: removeGroupByTrue })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: removeGroupByTrue })

    expect(result).toBe(output)
  })

  it('leaves a non-admin groupBy untouched', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({ source: input, transform: removeGroupByTrue })

    expect(result).toBe(output)
  })

  it('skips a non-boolean value and leaves it in place', async () => {
    const input = await fixture('non-boolean.input.ts')
    const output = await fixture('non-boolean.output.ts')

    const result = await runTransform({ source: input, transform: removeGroupByTrue })

    expect(result).toBe(output)
  })
})

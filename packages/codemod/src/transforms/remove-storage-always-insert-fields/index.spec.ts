import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removeStorageAlwaysInsertFields } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('remove-storage-always-insert-fields', () => {
  it('removes alwaysInsertFields from all storage adapter options', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: removeStorageAlwaysInsertFields })

    expect(result).toBe(output)
  })

  it('supports aliased imports and shorthand properties', async () => {
    const input = await fixture('aliased.input.ts')
    const output = await fixture('aliased.output.ts')

    const result = await runTransform({ source: input, transform: removeStorageAlwaysInsertFields })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      source: output,
      transform: removeStorageAlwaysInsertFields,
    })

    expect(result).toBe(output)
  })

  it('leaves unrelated and indirect options unchanged', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({ source: input, transform: removeStorageAlwaysInsertFields })

    expect(result).toBe(output)
  })
})

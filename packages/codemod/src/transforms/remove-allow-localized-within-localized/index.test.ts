import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removeAllowLocalizedWithinLocalized } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('remove-allow-localized-within-localized', () => {
  it('removes compatibility.allowLocalizedWithinLocalized and the empty compatibility object', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      source: input,
      transform: removeAllowLocalizedWithinLocalized,
    })

    expect(result).toBe(output)
  })

  it('is idempotent on already-migrated source', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      source: output,
      transform: removeAllowLocalizedWithinLocalized,
    })

    expect(result).toBe(output)
  })

  it('leaves configs without the flag untouched', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({
      source: input,
      transform: removeAllowLocalizedWithinLocalized,
    })

    expect(result).toBe(input)
  })
})

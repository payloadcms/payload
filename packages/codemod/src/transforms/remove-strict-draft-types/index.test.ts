import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removeStrictDraftTypes } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('remove-strict-draft-types', () => {
  it('removes strictDraftTypes while keeping other typescript properties', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: removeStrictDraftTypes })

    expect(result).toBe(output)
  })

  it('removes the entire typescript object when strictDraftTypes is the only property', async () => {
    const input = await fixture('only-flag.input.ts')
    const output = await fixture('only-flag.output.ts')

    const result = await runTransform({ source: input, transform: removeStrictDraftTypes })

    expect(result).toBe(output)
  })

  it('is idempotent on already-migrated source', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: removeStrictDraftTypes })

    expect(result).toBe(output)
  })

  it('leaves configs without the flag untouched', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({ source: input, transform: removeStrictDraftTypes })

    expect(result).toBe(input)
  })
})

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { renameEditViewTypes } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('rename-edit-view-types', () => {
  it('renames EditViewComponent and EditViewConfig imports', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: renameEditViewTypes })

    expect(result).toBe(output)
  })

  it('preserves the local alias when the local name differs from the renamed type', async () => {
    const input = await fixture('alias.input.ts')
    const output = await fixture('alias.output.ts')

    const result = await runTransform({ source: input, transform: renameEditViewTypes })

    expect(result).toBe(output)
  })

  it('is idempotent on already-migrated source', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: renameEditViewTypes })

    expect(result).toBe(output)
  })

  it('leaves unrelated imports untouched', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({ source: input, transform: renameEditViewTypes })

    expect(result).toBe(input)
  })

  it('does not rename matching type names imported from non-payload modules', async () => {
    const input = await fixture('third-party.input.ts')

    const result = await runTransform({ source: input, transform: renameEditViewTypes })

    expect(result).toBe(input)
  })
})

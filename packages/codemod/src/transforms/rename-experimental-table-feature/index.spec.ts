import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { renameExperimentalTableFeature } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('rename-experimental-table-feature', () => {
  it('renames EXPERIMENTAL_TableFeature to TableFeature and updates call sites', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: renameExperimentalTableFeature })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: renameExperimentalTableFeature })

    expect(result).toBe(output)
  })

  it('renames the imported name without touching an aliased local binding', async () => {
    const input = await fixture('alias.input.ts')
    const output = await fixture('alias.output.ts')

    const result = await runTransform({ source: input, transform: renameExperimentalTableFeature })

    expect(result).toBe(output)
  })

  it('no-ops on code without EXPERIMENTAL_TableFeature', async () => {
    const input = await fixture('no-match.input.ts')

    const result = await runTransform({ source: input, transform: renameExperimentalTableFeature })

    expect(result).toBe(input)
  })

  it('skips the rename when TableFeature is already imported from the same declaration', async () => {
    const input = await fixture('collision.input.ts')

    const result = await runTransform({ source: input, transform: renameExperimentalTableFeature })

    expect(result).toBe(input)
  })
})

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { globalsComponentsEdit } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('globals-components-edit', () => {
  it('migrates a global with elements (and hoists Description)', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: globalsComponentsEdit })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: globalsComponentsEdit })

    expect(result).toBe(output)
  })

  it('no-ops on a Collection config that already uses `edit`', async () => {
    const input = await fixture('collection.input.ts')

    const result = await runTransform({ source: input, transform: globalsComponentsEdit })

    expect(result).toBe(input)
  })
})

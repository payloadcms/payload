import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { consolidateDisabledFields } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('consolidate-disabled-fields', () => {
  it('migrates basic four-flag input', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: consolidateDisabledFields })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: consolidateDisabledFields })

    expect(result).toBe(output)
  })
})

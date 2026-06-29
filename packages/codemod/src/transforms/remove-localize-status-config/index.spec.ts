import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removeLocalizeStatusConfig } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('remove-localize-status-config', () => {
  it('removes localizeStatus: true and empty experimental block', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: removeLocalizeStatusConfig })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: removeLocalizeStatusConfig })

    expect(result).toBe(output)
  })

  it('preserves localizeStatus: false (explicit opt-out)', async () => {
    const input = await fixture('preserve-false.input.ts')
    const output = await fixture('preserve-false.output.ts')

    const result = await runTransform({ source: input, transform: removeLocalizeStatusConfig })

    expect(result).toBe(output)
  })
})

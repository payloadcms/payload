import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { renameDisableLocalStrategy } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('rename-disable-local-strategy', () => {
  it('renames disableLocalStrategy to localStrategy and inverts the value', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: renameDisableLocalStrategy })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: renameDisableLocalStrategy })

    expect(result).toBe(output)
  })

  it('no-ops on files that never reference disableLocalStrategy', async () => {
    const input = await fixture('no-match.input.ts')

    const result = await runTransform({ source: input, transform: renameDisableLocalStrategy })

    expect(result).toBe(input)
  })
})

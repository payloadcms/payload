import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removeLocalizeStatusConfig } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('remove-localize-status-config', () => {
  it('should remove localizeStatus: true and empty experimental block', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: removeLocalizeStatusConfig })

    expect(result).toBe(output)
  })

  it.each(['basic', 'remove-false'])('should be idempotent for %s', async (name) => {
    const output = await fixture(`${name}.output.ts`)

    const result = await runTransform({ source: output, transform: removeLocalizeStatusConfig })

    expect(result).toBe(output)
  })

  it('should remove localizeStatus: false because localized status is automatic', async () => {
    const input = await fixture('remove-false.input.ts')
    const output = await fixture('remove-false.output.ts')

    const result = await runTransform({ source: input, transform: removeLocalizeStatusConfig })

    expect(result).toBe(output)
  })

  it('should leave unrelated drafts options unchanged', async () => {
    const source = `export const drafts = { autosave: false, validate: true }\n`

    const result = await runTransform({ source, transform: removeLocalizeStatusConfig })

    expect(result).toBe(source)
  })
})

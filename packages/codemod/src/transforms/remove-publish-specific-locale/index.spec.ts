import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removePublishSpecificLocale } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('remove-publish-specific-locale', () => {
  it('renames publishSpecificLocale to locale when no locale prop exists', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: removePublishSpecificLocale })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: removePublishSpecificLocale })

    expect(result).toBe(output)
  })

  it('removes publishSpecificLocale when locale is already present', async () => {
    const input = await fixture('already-has-locale.input.ts')
    const output = await fixture('already-has-locale.output.ts')

    const result = await runTransform({ source: input, transform: removePublishSpecificLocale })

    expect(result).toBe(output)
  })

  it('does not modify non-update/updateGlobal calls', async () => {
    const input = await fixture('non-matching.input.ts')
    const output = await fixture('non-matching.output.ts')

    const result = await runTransform({ source: input, transform: removePublishSpecificLocale })

    expect(result).toBe(output)
  })
})

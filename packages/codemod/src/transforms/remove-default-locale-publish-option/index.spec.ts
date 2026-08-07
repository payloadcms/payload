import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removeDefaultLocalePublishOption } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('remove-default-locale-publish-option', () => {
  it("removes defaultLocalePublishOption: 'active'", async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      source: input,
      transform: removeDefaultLocalePublishOption,
    })

    expect(result).toBe(output)
  })

  it("removes defaultLocalePublishOption: 'all'", async () => {
    const input = await fixture('value-all.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      source: input,
      transform: removeDefaultLocalePublishOption,
    })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      source: output,
      transform: removeDefaultLocalePublishOption,
    })

    expect(result).toBe(output)
  })

  it('is a no-op when the property is not present', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({
      source: input,
      transform: removeDefaultLocalePublishOption,
    })

    expect(result).toBe(input)
  })
})

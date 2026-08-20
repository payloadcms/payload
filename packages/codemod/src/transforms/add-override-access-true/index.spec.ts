import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { addOverrideAccessTrue } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('add-override-access-true', () => {
  it('appends overrideAccess: true to Local API calls that omit it', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('transforms JavaScript, where no type information is available', async () => {
    const input = await fixture('javascript.input.js')
    const output = await fixture('javascript.output.js')

    const result = await runTransform({
      filename: 'input.js',
      source: input,
      transform: addOverrideAccessTrue,
    })

    expect(result).toBe(output)
  })

  it('handles a trailing comment after the last property without emitting a double comma', async () => {
    const input = await fixture('trailing-comment.input.ts')
    const output = await fixture('trailing-comment.output.ts')

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('handles a comment between properties without corrupting the preceding comma', async () => {
    const input = await fixture('comment-between-properties.input.ts')
    const output = await fixture('comment-between-properties.output.ts')

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('keeps single-line and empty argument objects on one line', async () => {
    const input = await fixture('single-line.input.ts')
    const output = await fixture('single-line.output.ts')

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('leaves internal operations, already-required operations, spreads and non-Payload receivers untouched', async () => {
    const input = await fixture('non-matching.input.ts')
    const output = await fixture('non-matching.output.ts')

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })
})

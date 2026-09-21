import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { addOverrideAccessTrue } from './index.js'

const fixtureDirectory = dirname(fileURLToPath(import.meta.url))
const fixture = ({ name }: { name: string }) => readFile(join(fixtureDirectory, name), 'utf8')

describe('add-override-access-true', () => {
  it('should append overrideAccess: true to Local API calls that omit it', async () => {
    const input = await fixture({ name: 'basic.input.ts' })
    const output = await fixture({ name: 'basic.output.ts' })

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('should be idempotent', async () => {
    const output = await fixture({ name: 'basic.output.ts' })

    const result = await runTransform({ source: output, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('should transform JavaScript where no type information is available', async () => {
    const input = await fixture({ name: 'javascript.input.js' })
    const output = await fixture({ name: 'javascript.output.js' })

    const result = await runTransform({
      filename: 'input.js',
      source: input,
      transform: addOverrideAccessTrue,
    })

    expect(result).toBe(output)
  })

  it('should handle a trailing comment after the last property without emitting a double comma', async () => {
    const input = await fixture({ name: 'trailing-comment.input.ts' })
    const output = await fixture({ name: 'trailing-comment.output.ts' })

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('should handle a comment between properties without corrupting the preceding comma', async () => {
    const input = await fixture({ name: 'comment-between-properties.input.ts' })
    const output = await fixture({ name: 'comment-between-properties.output.ts' })

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('should keep single-line and empty argument objects on one line', async () => {
    const input = await fixture({ name: 'single-line.input.ts' })
    const output = await fixture({ name: 'single-line.output.ts' })

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('should leave internal operations, already-required operations, spreads and non-Payload receivers untouched', async () => {
    const input = await fixture({ name: 'non-matching.input.ts' })
    const output = await fixture({ name: 'non-matching.output.ts' })

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })
})

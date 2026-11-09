import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
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

  it('should preserve a block comment before an existing trailing comma', async () => {
    const input = `await payload.find({
  collection: 'posts' /* note */,
})`

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(`await payload.find({
  collection: 'posts' /* note */,
  overrideAccess: true,
})`)
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

  it('should report every Local API call it skips because of a spread or a non-literal argument', async () => {
    const source = await fixture({ name: 'skipped.input.ts' })
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/skipped.ts', source)

    const result = await addOverrideAccessTrue.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringMatching(/^\/skipped\.ts:4: `payload\.find\(\)` .*spread/),
      expect.stringMatching(/^\/skipped\.ts:9: `req\.payload\.update\(\)` .*spread/),
      expect.stringMatching(/^\/skipped\.ts:13: `payload\.findByID\(\)` .*not an object literal/),
      expect.stringMatching(/^\/skipped\.ts:15: `payload\.count\(\)` .*not an object literal/),
      expect.stringMatching(
        /^\/skipped\.ts:17: `payload\.jobs\.queue\(\)` .*not an object literal/,
      ),
    ])
  })

  it('should not report anything when every call was handled', async () => {
    const source = await fixture({ name: 'basic.input.ts' })
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('/basic.ts', source)

    const result = await addOverrideAccessTrue.apply({ packageJsons: [], project })

    expect(result.notes).toBeUndefined()
  })
})

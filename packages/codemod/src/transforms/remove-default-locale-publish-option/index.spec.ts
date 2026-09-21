import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removeDefaultLocalePublishOption } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('remove-default-locale-publish-option', () => {
  it('removes localization.defaultLocalePublishOption', async () => {
    const input = await fixture('basic.input.ts')
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

  it('leaves a defaultLocalePublishOption outside of localization untouched', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({
      source: input,
      transform: removeDefaultLocalePublishOption,
    })

    expect(result).toBe(output)
  })

  it("emits a note when the value was 'all'", async () => {
    const input = await fixture('all-value.input.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('input.ts', input)

    const result = await removeDefaultLocalePublishOption.apply({ packageJsons: [], project })

    expect(result.filesChanged).toEqual(['/input.ts'])
    expect(result.notes).toEqual([expect.stringContaining("was set to 'all'")])
  })

  it("removes the property from a shorthand localization config and emits an 'all' note", async () => {
    const input = await fixture('shorthand.input.ts')
    const output = await fixture('shorthand.output.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('input.ts', input)

    const result = await removeDefaultLocalePublishOption.apply({ packageJsons: [], project })

    expect(sourceFile.getFullText()).toBe(output)
    expect(result.filesChanged).toEqual(['/input.ts'])
    expect(result.notes).toEqual([expect.stringContaining("was set to 'all'")])
  })

  it('emits a manual migration note for a dynamic localization config', async () => {
    const input = await fixture('dynamic.input.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('input.ts', input)

    const result = await removeDefaultLocalePublishOption.apply({ packageJsons: [], project })

    expect(sourceFile.getFullText()).toBe(input)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([expect.stringContaining('migrate manually')])
  })
})

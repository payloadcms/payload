import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateLexicalIsHTMLElement } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-lexical-is-html-element', () => {
  it('rewrites a sole isHTMLElement import to lexical', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateLexicalIsHTMLElement })

    expect(result).toBe(output)
  })

  it('moves isHTMLElement out of a mixed import and merges into existing lexical import', async () => {
    const input = await fixture('mixed.input.ts')
    const output = await fixture('mixed.output.ts')

    const result = await runTransform({ source: input, transform: migrateLexicalIsHTMLElement })

    expect(result).toBe(output)
  })

  it('warns that lexical must be installed', async () => {
    const input = await fixture('basic.input.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('input.ts', input)

    const result = await migrateLexicalIsHTMLElement.apply({ packageJsons: [], project })

    expect(result.notes).toEqual([expect.stringContaining('pnpm add lexical')])
  })

  it('is idempotent on already-migrated source', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateLexicalIsHTMLElement })

    expect(result).toBe(output)
  })

  it('leaves unrelated imports untouched', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({ source: input, transform: migrateLexicalIsHTMLElement })

    expect(result).toBe(input)
  })
})

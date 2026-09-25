import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateAfterOperationRead } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-after-operation-read', () => {
  it("expands `operation === 'read'` to handle find and findByID", async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateAfterOperationRead })

    expect(result).toBe(output)
  })

  it('resolves an aliased operation arg and parenthesizes negated checks inside logical expressions', async () => {
    const input = await fixture('alias.input.ts')
    const output = await fixture('alias.output.ts')

    const result = await runTransform({ source: input, transform: migrateAfterOperationRead })

    expect(result).toBe(output)
  })

  it('is idempotent on already-migrated source', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateAfterOperationRead })

    expect(result).toBe(output)
  })

  it("leaves beforeOperation's `operation === 'read'` untouched", async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({ source: input, transform: migrateAfterOperationRead })

    expect(result).toBe(input)
  })

  it('emits a note for a non-inline afterOperation hook', async () => {
    const input = await fixture('external.input.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('input.ts', input)

    const result = await migrateAfterOperationRead.apply({ packageJsons: [], project })

    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([expect.stringContaining('not an inline function')])
  })
})

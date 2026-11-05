import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removeStrictDraftTypes } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))

describe('remove-strict-draft-types', () => {
  it('should remove the option regardless of its value and preserve other settings', async () => {
    const input = await readFile(join(here, 'basic.input.ts'), 'utf8')
    const output = await readFile(join(here, 'basic.output.ts'), 'utf8')

    const result = await runTransform({ source: input, transform: removeStrictDraftTypes })

    expect(result).toBe(output)
  })

  it('should be idempotent', async () => {
    const output = await readFile(join(here, 'basic.output.ts'), 'utf8')

    const result = await runTransform({ source: output, transform: removeStrictDraftTypes })

    expect(result).toBe(output)
  })

  it('should leave unrelated options untouched', async () => {
    const input = await readFile(join(here, 'no-match.input.ts'), 'utf8')

    const result = await runTransform({ source: input, transform: removeStrictDraftTypes })

    expect(result).toBe(input)
  })

  it('should report only changed files', async () => {
    const project = new Project({ useInMemoryFileSystem: true })

    project.createSourceFile(
      'config.ts',
      'const config = { typescript: { strictDraftTypes: false } }',
    )
    project.createSourceFile('other.ts', 'const other = { strictDraftTypes: true }')

    const result = await removeStrictDraftTypes.apply({ packageJsons: [], project })

    expect(result.filesChanged).toEqual(['/config.ts'])
    expect(
      (await removeStrictDraftTypes.apply({ packageJsons: [], project })).filesChanged,
    ).toEqual([])
  })
})

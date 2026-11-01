import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateDisplayedFieldValueArgs } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-displayed-field-value-args', () => {
  it('should migrate an aliased named import', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    expect(await runTransform({ source: input, transform: migrateDisplayedFieldValueArgs })).toBe(
      output,
    )
  })

  it('should migrate a namespace import', async () => {
    const input = await fixture('namespace.input.ts')
    const output = await fixture('namespace.output.ts')

    expect(await runTransform({ source: input, transform: migrateDisplayedFieldValueArgs })).toBe(
      output,
    )
  })

  it('should be idempotent', async () => {
    const output = await fixture('basic.output.ts')

    expect(await runTransform({ source: output, transform: migrateDisplayedFieldValueArgs })).toBe(
      output,
    )
  })

  it('should leave unrelated imports unchanged', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    expect(await runTransform({ source: input, transform: migrateDisplayedFieldValueArgs })).toBe(
      output,
    )
  })

  it('should report calls it cannot safely migrate', async () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile(
      '/fixture.ts',
      "import { getDisplayedFieldValue } from '@payloadcms/ui/utilities/getDisplayedFieldValue'\ngetDisplayedFieldValue(...args)\n",
    )

    const result = await migrateDisplayedFieldValueArgs.apply({ packageJsons: [], project })

    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([expect.stringContaining('migrate manually')])
    expect(file.getFullText()).toContain('getDisplayedFieldValue(...args)')
  })
})

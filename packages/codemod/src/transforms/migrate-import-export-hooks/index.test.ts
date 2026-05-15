import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateImportExportHooks } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-import-export-hooks', () => {
  it('migrates toCSV to hooks.beforeExport', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateImportExportHooks })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateImportExportHooks })

    expect(result).toBe(output)
  })

  it('migrates both toCSV and fromCSV together', async () => {
    const input = await fixture('both.input.ts')
    const output = await fixture('both.output.ts')

    const result = await runTransform({ source: input, transform: migrateImportExportHooks })

    expect(result).toBe(output)
  })

  it('merges into existing hooks object when present', async () => {
    const input = await fixture('existing-hooks.input.ts')
    const output = await fixture('existing-hooks.output.ts')

    const result = await runTransform({ source: input, transform: migrateImportExportHooks })

    expect(result).toBe(output)
  })

  it('drops toCSV when hooks.beforeExport already exists', async () => {
    const input = await fixture('hooks-priority.input.ts')
    const output = await fixture('hooks-priority.output.ts')

    const result = await runTransform({ source: input, transform: migrateImportExportHooks })

    expect(result).toBe(output)
  })

  it('no-ops on code without toCSV or fromCSV', async () => {
    const input = await fixture('non-matching.input.ts')
    const output = await fixture('non-matching.output.ts')

    const result = await runTransform({ source: input, transform: migrateImportExportHooks })

    expect(result).toBe(output)
  })
})

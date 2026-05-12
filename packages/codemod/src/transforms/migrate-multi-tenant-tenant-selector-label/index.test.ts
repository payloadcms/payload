import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateMultiTenantTenantSelectorLabel } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-multi-tenant-tenant-selector-label', () => {
  it('migrates object tenantSelectorLabel to i18n.translations', async () => {
    const input = await fixture('object.input.ts')
    const output = await fixture('object.output.ts')

    const result = await runTransform({
      source: input,
      transform: migrateMultiTenantTenantSelectorLabel,
    })

    expect(result).toBe(output)
  })

  it('removes string tenantSelectorLabel and emits a note', async () => {
    const input = await fixture('string.input.ts')
    const output = await fixture('string.output.ts')

    const result = await runTransform({
      source: input,
      transform: migrateMultiTenantTenantSelectorLabel,
    })

    expect(result).toBe(output)
  })

  it('is idempotent on object output', async () => {
    const output = await fixture('object.output.ts')

    const result = await runTransform({
      source: output,
      transform: migrateMultiTenantTenantSelectorLabel,
    })

    expect(result).toBe(output)
  })

  it('is idempotent on string output', async () => {
    const output = await fixture('string.output.ts')

    const result = await runTransform({
      source: output,
      transform: migrateMultiTenantTenantSelectorLabel,
    })

    expect(result).toBe(output)
  })

  it('leaves config without tenantSelectorLabel untouched', async () => {
    const input = await fixture('no-match.input.ts')

    const result = await runTransform({
      source: input,
      transform: migrateMultiTenantTenantSelectorLabel,
    })

    expect(result).toBe(input)
  })
})

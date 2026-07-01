import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateMultiTenantUseBaseListFilter } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-multi-tenant-use-base-list-filter', () => {
  it('renames useBaseListFilter to useBaseFilter inside collections config', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      source: input,
      transform: migrateMultiTenantUseBaseListFilter,
    })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      source: output,
      transform: migrateMultiTenantUseBaseListFilter,
    })

    expect(result).toBe(output)
  })

  it('leaves useBaseListFilter outside a collections context untouched', async () => {
    const input = await fixture('no-match.input.ts')

    const result = await runTransform({
      source: input,
      transform: migrateMultiTenantUseBaseListFilter,
    })

    expect(result).toBe(input)
  })
})

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateForceSelect } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-force-select', () => {
  it('migrates forceSelect object literal to a select function', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateForceSelect })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateForceSelect })

    expect(result).toBe(output)
  })

  it('no-ops on unrelated code', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({ source: input, transform: migrateForceSelect })

    expect(result).toBe(output)
  })

  it('removes forceSelect when sibling select already present', async () => {
    const input = `export const Pages = {
  slug: 'pages',
  select: ({ select }) => select,
  forceSelect: {
    title: true,
  },
  fields: [],
}
`

    const result = await runTransform({ source: input, transform: migrateForceSelect })

    expect(result).not.toContain('forceSelect')
    expect(result).toContain('select: ({ select }) => select')
  })

  it('removes non-literal forceSelect and emits a manual-migration note', async () => {
    const input = `const forced = { title: true }
export const Pages = {
  slug: 'pages',
  forceSelect: forced,
  fields: [],
}
`

    const result = await runTransform({ source: input, transform: migrateForceSelect })

    expect(result).not.toContain('forceSelect')
  })

  it('flags nested object literals for manual review', async () => {
    const input = `export const Pages = {
  slug: 'pages',
  forceSelect: {
    group: {
      sub: true,
    },
  },
  fields: [],
}
`

    const result = await runTransform({ source: input, transform: migrateForceSelect })

    expect(result).toContain('select: ({ select }) =>')
    expect(result).not.toContain('forceSelect')
  })
})

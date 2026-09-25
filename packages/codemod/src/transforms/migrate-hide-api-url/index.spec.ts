import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateHideAPIURL } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-hide-api-url', () => {
  it('migrates admin.hideAPIURL: true to nested condition', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateHideAPIURL })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateHideAPIURL })

    expect(result).toBe(output)
  })

  it('no-ops on unrelated code', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({ source: input, transform: migrateHideAPIURL })

    expect(result).toBe(output)
  })

  it('plugs condition into existing admin.components.views.edit.api.tab', async () => {
    const input = `export const Pages = {
  slug: 'pages',
  admin: {
    hideAPIURL: true,
    components: {
      views: {
        edit: {
          api: {
            tab: {
              label: 'Custom API',
            },
          },
        },
      },
    },
  },
  fields: [],
}
`

    const result = await runTransform({ source: input, transform: migrateHideAPIURL })

    expect(result).not.toContain('hideAPIURL')
    expect(result).toContain("label: 'Custom API'")
    expect(result).toContain('condition: () => false')
  })

  it('adds missing tab segment when partial path exists', async () => {
    const input = `export const Pages = {
  slug: 'pages',
  admin: {
    hideAPIURL: true,
    components: {
      views: {
        edit: {
          api: {},
        },
      },
    },
  },
  fields: [],
}
`

    const result = await runTransform({ source: input, transform: migrateHideAPIURL })

    expect(result).not.toContain('hideAPIURL')
    expect(result).toContain('tab:')
    expect(result).toContain('condition: () => false')
  })

  it('preserves existing condition and removes hideAPIURL', async () => {
    const input = `export const Pages = {
  slug: 'pages',
  admin: {
    hideAPIURL: true,
    components: {
      views: {
        edit: {
          api: {
            tab: {
              condition: () => true,
            },
          },
        },
      },
    },
  },
  fields: [],
}
`

    const result = await runTransform({ source: input, transform: migrateHideAPIURL })

    expect(result).not.toContain('hideAPIURL')
    expect(result).toContain('condition: () => true')
    expect(result).not.toContain('condition: () => false')
  })
})

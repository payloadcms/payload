import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { removeLocalizeStatusConfig } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('remove-localize-status-config', () => {
  it('should remove localizeStatus: true and empty experimental block', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: removeLocalizeStatusConfig })

    expect(result).toBe(output)
  })

  it.each(['basic', 'remove-false'])('should be idempotent for %s', async (name) => {
    const output = await fixture(`${name}.output.ts`)

    const result = await runTransform({ source: output, transform: removeLocalizeStatusConfig })

    expect(result).toBe(output)
  })

  it('should remove localizeStatus: false because localized status is automatic', async () => {
    const input = await fixture('remove-false.input.ts')
    const output = await fixture('remove-false.output.ts')

    const result = await runTransform({ source: input, transform: removeLocalizeStatusConfig })

    expect(result).toBe(output)
  })

  it('should leave unrelated drafts options unchanged', async () => {
    const source = `export const drafts = { autosave: false, validate: true }\n`

    const result = await runTransform({ source, transform: removeLocalizeStatusConfig })

    expect(result).toBe(source)
  })

  it.each(['true', 'false'])('should remove inline config settings set to %s', async (value) => {
    const source = `import { buildConfig as configure } from 'payload'
export default configure({ experimental: { localizeStatus: ${value} }, collections: [{ slug: 'posts', versions: { drafts: { localizeStatus: ${value}, autosave: false } }, fields: [] }], globals: [{ slug: 'settings', versions: { drafts: { localizeStatus: ${value} } }, fields: [] }] })`

    const result = await runTransform({ source, transform: removeLocalizeStatusConfig })

    expect(result).not.toContain('localizeStatus')
    expect(result).not.toContain('experimental:')
    expect(result).toContain('autosave: false')
  })

  it('should preserve unrelated properties and empty experimental objects', async () => {
    const source = `const state: { localizeStatus: boolean } = {
  localizeStatus: false,
}
const unrelated = {
  experimental: {
    localizeStatus: true,
  },
  versions: {
    drafts: {
      localizeStatus: false,
    },
  },
}
const other = {
  experimental: {},
}
`

    const result = await runTransform({ source, transform: removeLocalizeStatusConfig })

    expect(result).toBe(source)
  })

  it.each(['CollectionConfig', 'GlobalConfig'])(
    'should migrate separately typed %s objects',
    async (type) => {
      const source = `import type { ${type} as Config } from 'payload'
export const entity: Config = { slug: 'posts', versions: { drafts: { localizeStatus: false, autosave: true } }, fields: [] }`

      const result = await runTransform({ source, transform: removeLocalizeStatusConfig })

      expect(result).not.toContain('localizeStatus')
      expect(result).toContain('autosave: true')
    },
  )

  it('should follow local constants while preserving custom config data', async () => {
    const source = `import { buildConfig } from 'payload'
const Posts = { slug: 'posts', versions: { drafts: { localizeStatus: false } }, fields: [] }
const collections = [Posts]
const config = { collections, custom: { localizeStatus: false } }
export default buildConfig(config)`

    const result = await runTransform({ source, transform: removeLocalizeStatusConfig })

    expect(result).toContain('custom: { localizeStatus: false }')
    expect(result.match(/localizeStatus/g)).toHaveLength(1)
  })

  it('should migrate configs declared with satisfies', async () => {
    const source = `import type { Config } from 'payload'
export default { experimental: { localizeStatus: false, otherFlag: true } } satisfies Config`

    const result = await runTransform({ source, transform: removeLocalizeStatusConfig })

    expect(result).not.toContain('localizeStatus')
    expect(result).toContain('otherFlag: true')
  })
})

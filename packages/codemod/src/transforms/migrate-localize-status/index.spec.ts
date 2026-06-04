import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateLocalizeStatus } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-localize-status', () => {
  it('removes experimental.localizeStatus and the empty experimental block', async () => {
    const input = await fixture('removes-localize-status.input.ts')
    const output = await fixture('removes-localize-status.output.ts')

    const result = await runTransform({ source: input, transform: migrateLocalizeStatus })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('removes-localize-status.output.ts')

    const result = await runTransform({ source: output, transform: migrateLocalizeStatus })

    expect(result).toBe(output)
  })

  it('removes only localizeStatus and preserves other experimental flags', async () => {
    const input = await fixture('preserves-other-experimental.input.ts')
    const output = await fixture('preserves-other-experimental.output.ts')

    const result = await runTransform({ source: input, transform: migrateLocalizeStatus })

    expect(result).toBe(output)
  })

  it('no-ops on config without experimental', async () => {
    const input = await fixture('no-match.input.ts')

    const result = await runTransform({ source: input, transform: migrateLocalizeStatus })

    expect(result).toBe(input)
  })
})

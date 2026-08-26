import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateBlockReferencesToBlocks } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-block-references-to-blocks', () => {
  it('renames blocks field `blockReferences` to `blocks`', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      source: input,
      transform: migrateBlockReferencesToBlocks,
    })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({
      source: output,
      transform: migrateBlockReferencesToBlocks,
    })

    expect(result).toBe(output)
  })

  it('no-ops when `blockReferences` is not present', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({
      source: input,
      transform: migrateBlockReferencesToBlocks,
    })

    expect(result).toBe(input)
  })

  it('does not clobber an existing non-empty `blocks` sibling', async () => {
    const input = await fixture('sibling.input.ts')

    const result = await runTransform({
      source: input,
      transform: migrateBlockReferencesToBlocks,
    })

    expect(result).toBe(input)
  })
})

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { renameTypescriptSchemaToJsonSchema } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('rename-typescript-schema-to-json-schema', () => {
  it('renames `typescriptSchema` to `jsonSchema`', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: renameTypescriptSchemaToJsonSchema })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: renameTypescriptSchemaToJsonSchema })

    expect(result).toBe(output)
  })

  it('no-ops on code without `typescriptSchema`', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({ source: input, transform: renameTypescriptSchemaToJsonSchema })

    expect(result).toBe(input)
  })

  it('does not clobber an existing `jsonSchema` sibling', async () => {
    const input = await fixture('sibling.input.ts')

    const result = await runTransform({ source: input, transform: renameTypescriptSchemaToJsonSchema })

    expect(result).toBe(input)
  })
})

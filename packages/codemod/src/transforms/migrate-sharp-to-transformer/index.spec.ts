import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateSharpToTransformer } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-sharp-to-transformer', () => {
  it('moves a top-level sharp dependency and per-collection Sharp options into sharpTransformer', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateSharpToTransformer })

    expect(result).toBe(output)
  })

  it('no-ops on unrelated code', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toBe(output)
  })

  it('appends sharpTransformer to an existing transformers array without disturbing other entries', async () => {
    const input = await fixture('existing-transformers.input.ts')
    const output = await fixture('existing-transformers.output.ts')

    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toBe(output)
  })

  it('preserves an injected (non-default) sharp dependency', async () => {
    const input = `import myCustomSharp from 'sharp'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  sharp: myCustomSharp,
})
`
    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toContain('sharpTransformer({ sharp: myCustomSharp })')
    expect(result).not.toContain('sharp: myCustomSharp,\n})')
  })

  it('moves crop and focalPoint into sharpTransformer instead of leaving them on the collection upload', async () => {
    const input = `import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        crop: false,
        focalPoint: true,
        staticDir: 'media',
      },
    },
  ],
})
`
    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })
    const [beforeTransformerCall, afterTransformerCall] = result.split('sharpTransformer(')

    expect(beforeTransformerCall).not.toMatch(/crop|focalPoint/)
    expect(afterTransformerCall).toContain('crop: false')
    expect(afterTransformerCall).toContain('focalPoint: true')
  })
})

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateSharpToTransformer } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

const runTransformWithNotes = async ({ input }: { input: string }) => {
  const project = new Project({ useInMemoryFileSystem: true })
  const file = project.createSourceFile('/payload.config.ts', input)
  const result = await migrateSharpToTransformer.apply({ packageJsons: [], project })

  return { notes: result.notes ?? [], source: file.getFullText() }
}

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

  it.each([
    ['a call expression', 'transformers: makeTransformers(),'],
    ['an identifier', 'transformers: sharedTransformers,'],
    ['a shorthand property', 'transformers,'],
  ])(
    'does not add a duplicate transformers property when the existing one is %s',
    async (_, transformersPropertyText) => {
      const input = `import sharp from 'sharp'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  sharp,
  upload: {
    ${transformersPropertyText}
  },
})
`
      const { notes, source } = await runTransformWithNotes({ input })

      expect(source.match(/transformers\b/g)).toHaveLength(1)
      expect(source).toContain(transformersPropertyText)
      expect(notes).toContainEqual(
        expect.stringContaining(
          "`upload.transformers` isn't an inline array — add `sharpTransformer({ sharp })`",
        ),
      )
    },
  )

  it('does not add a transformers property after a spread that may already set it', async () => {
    const input = `import sharp from 'sharp'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  sharp,
  upload: {
    ...sharedUpload,
  },
})
`
    const { notes, source } = await runTransformWithNotes({ input })

    expect(source).not.toContain('transformers')
    expect(notes).toContainEqual(
      expect.stringContaining(
        '`upload` contains a spread that may already set `transformers` — add `sharpTransformer({ sharp })`',
      ),
    )
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

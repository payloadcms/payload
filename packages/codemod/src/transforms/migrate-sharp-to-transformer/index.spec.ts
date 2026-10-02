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
    [
      'a call-expression transformers property',
      'upload: {\n    transformers: makeTransformers(),\n  },',
      "`upload.transformers` isn't an inline array",
    ],
    [
      'an identifier transformers property',
      'upload: {\n    transformers: sharedTransformers,\n  },',
      "`upload.transformers` isn't an inline array",
    ],
    [
      'a shorthand transformers property',
      'upload: {\n    transformers,\n  },',
      "`upload.transformers` isn't an inline array",
    ],
    [
      'a spread in upload',
      'upload: {\n    ...sharedUpload,\n  },',
      '`upload` contains a spread that may already set `transformers`',
    ],
    ['a non-inline upload object', 'upload: sharedUpload,', "`upload` isn't an inline object"],
  ])(
    'leaves the config unchanged and reports why when sharpTransformer cannot be registered due to %s',
    async (_, uploadPropertyText, expectedNote) => {
      const input = `import sharp from 'sharp'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        imageSizes: [{ name: 'thumbnail', width: 400 }],
        staticDir: 'media',
      },
    },
  ],
  sharp,
  ${uploadPropertyText}
})
`
      const { notes, source } = await runTransformWithNotes({ input })

      expect(source).toBe(input)
      expect(notes).toContainEqual(expect.stringContaining(expectedNote))
      expect(notes).toContainEqual(
        expect.stringContaining('then remove the migrated Sharp settings'),
      )
    },
  )

  it('uses the local alias of an existing sharpTransformer import', async () => {
    const input = `import { sharpTransformer as st } from '@payloadcms/transformer-sharp'
import sharp from 'sharp'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  sharp,
})
`
    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toContain('transformers: [st({ sharp })]')
    expect(result).toContain(
      "import { sharpTransformer as st } from '@payloadcms/transformer-sharp'\n",
    )
    expect(result).not.toMatch(/\bsharpTransformer\(/)
    expect(await runTransform({ source: result, transform: migrateSharpToTransformer })).toBe(
      result,
    )
  })

  it('renames imageSizes to variants in an already-migrated sharpTransformer config', async () => {
    const input = `import { sharpTransformer } from '@payloadcms/transformer-sharp'
import { buildConfig } from 'payload'

const imageSizes = [{ name: 'card', width: 600 }]

export default buildConfig({
  collections: [],
  upload: {
    transformers: [
      sharpTransformer({
        collections: {
          media: { crop: false, imageSizes: [{ name: 'thumbnail', width: 400 }] },
          posters: { imageSizes },
        },
      }),
    ],
  },
})
`
    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toContain(
      "media: { crop: false, variants: [{ name: 'thumbnail', width: 400 }] }",
    )
    expect(result).toContain('posters: { variants: imageSizes }')
    expect(await runTransform({ source: result, transform: migrateSharpToTransformer })).toBe(
      result,
    )
  })

  it('renames imageSizes to variants in a sharpTransformer call outside buildConfig', async () => {
    const input = `import { sharpTransformer } from '@payloadcms/transformer-sharp'

export const transformers = [
  sharpTransformer({ collections: { media: { imageSizes: [{ name: 'thumbnail' }] } } }),
]
`
    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toContain("media: { variants: [{ name: 'thumbnail' }] }")
  })

  it('moves shorthand Sharp options into sharpTransformer', async () => {
    const input = `import { buildConfig } from 'payload'

const imageSizes = [{ name: 'thumbnail', width: 400 }]
const focalPoint = true

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        focalPoint,
        imageSizes,
        staticDir: 'media',
      },
    },
  ],
})
`
    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })
    const [beforeTransformerCall, afterTransformerCall] = result.split('sharpTransformer(')

    expect(beforeTransformerCall).toContain("upload: {\n        staticDir: 'media',\n      },")
    expect(afterTransformerCall).toContain('media: { variants: imageSizes, focalPoint }')
  })

  it('reports a Sharp option it cannot move instead of leaving it behind silently', async () => {
    const input = `import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        get imageSizes() {
          return []
        },
      },
    },
  ],
})
`
    const { notes } = await runTransformWithNotes({ input })

    expect(notes).toContainEqual(
      expect.stringContaining("collection 'media''s `upload.imageSizes` isn't a plain property"),
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
})

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

const runTransformOnFiles = async ({ files }: { files: Record<string, string> }) => {
  const project = new Project({ useInMemoryFileSystem: true })

  for (const [path, source] of Object.entries(files)) {
    project.createSourceFile(path, source)
  }

  const result = await migrateSharpToTransformer.apply({ packageJsons: [], project })
  const sources = Object.fromEntries(
    Object.keys(files).map((path) => [path, project.getSourceFileOrThrow(path).getFullText()]),
  )

  return { filesChanged: result.filesChanged, notes: result.notes ?? [], sources }
}

const splitConfig = ({
  importPath = './collections/Media',
  importStatement,
}: {
  importPath?: string
  importStatement?: string
} = {}) => `import { buildConfig } from 'payload'
import sharp from 'sharp'

${importStatement ?? `import { Media } from '${importPath}'`}

export default buildConfig({
  collections: [Media],
  sharp,
})
`

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

  it('leaves a local function named sharpTransformer untouched', async () => {
    const input = `const sharpTransformer = (args: { collections: Record<string, unknown> }) => args

export const transformers = [
  sharpTransformer({ collections: { media: { imageSizes: [{ name: 'thumbnail' }] } } }),
]
`
    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toBe(input)
  })

  it('imports sharpTransformer under a collision-free alias when the name is already taken', async () => {
    const input = `import sharp from 'sharp'
import { buildConfig } from 'payload'

const sharpTransformer = (args: { collections: Record<string, unknown> }) => args

export const transformers = [
  sharpTransformer({ collections: { media: { imageSizes: [{ name: 'thumbnail' }] } } }),
]

export default buildConfig({
  collections: [],
  sharp,
})
`
    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toContain(
      "import { sharpTransformer as sharpTransformer2 } from '@payloadcms/transformer-sharp'\n",
    )
    expect(result).toContain('transformers: [sharpTransformer2({ sharp })]')
    expect(result).toContain("media: { imageSizes: [{ name: 'thumbnail' }] }")
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

  describe('collections defined in other files', () => {
    it('should move Sharp options out of an imported collection file into sharpTransformer', async () => {
      const { filesChanged, sources } = await runTransformOnFiles({
        files: {
          '/collections/Media.ts': `import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  fields: [],
  upload: {
    focalPoint: true,
    imageSizes: [{ name: 'thumbnail', width: 300 }],
    staticDir: 'media',
  },
}
`,
          '/payload.config.ts': splitConfig(),
        },
      })

      expect(sources['/collections/Media.ts']).toBe(`import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  fields: [],
  upload: {
    staticDir: 'media',
  },
}
`)
      expect(sources['/payload.config.ts']).toContain(
        "sharpTransformer({ sharp, collections: { media: { variants: [{ name: 'thumbnail', width: 300 }], focalPoint: true } } })",
      )
      expect(sources['/payload.config.ts']).not.toContain('  sharp,\n')
      expect(filesChanged).toEqual(
        expect.arrayContaining(['/collections/Media.ts', '/payload.config.ts']),
      )
    })

    it.for([
      {
        name: 'a .js import of a satisfies-typed collection',
        collectionSource: `import type { CollectionConfig } from 'payload'

export const Media = {
  slug: 'media',
  fields: [],
  upload: { imageSizes: [{ name: 'thumbnail', width: 300 }] },
} satisfies CollectionConfig
`,
        config: splitConfig({ importPath: './collections/Media.js' }),
      },
      {
        name: 'a default-exported collection',
        collectionSource: `const Media = {
  slug: 'media',
  fields: [],
  upload: { imageSizes: [{ name: 'thumbnail', width: 300 }] },
}

export default Media
`,
        config: splitConfig({ importStatement: "import Media from './collections/Media'" }),
      },
    ])('should resolve $name', async ({ collectionSource, config }) => {
      const { sources } = await runTransformOnFiles({
        files: { '/collections/Media.ts': collectionSource, '/payload.config.ts': config },
      })

      expect(sources['/collections/Media.ts']).not.toContain('imageSizes')
      expect(sources['/payload.config.ts']).toContain(
        "collections: { media: { variants: [{ name: 'thumbnail', width: 300 }] } }",
      )
    })

    it('should key the entry by the resolved slug when the collection file uses a slug constant', async () => {
      const { sources } = await runTransformOnFiles({
        files: {
          '/collections/Media.ts': `import { mediaSlug } from '../slugs'

export const Media = {
  slug: mediaSlug,
  fields: [],
  upload: { crop: false },
}
`,
          '/payload.config.ts': splitConfig(),
          '/slugs.ts': "export const mediaSlug = 'media'\n",
        },
      })

      expect(sources['/payload.config.ts']).toContain('collections: { media: { crop: false } }')
      expect(sources['/payload.config.ts']).not.toContain('mediaSlug')
    })

    it("should leave an imported collection unchanged and name its file when a moved value uses that file's bindings", async () => {
      const collectionSource = `const sizes = [{ name: 'thumbnail', width: 300 }]

export const Media = {
  slug: 'media',
  fields: [],
  upload: { imageSizes: sizes },
}
`
      const { notes, sources } = await runTransformOnFiles({
        files: { '/collections/Media.ts': collectionSource, '/payload.config.ts': splitConfig() },
      })

      expect(sources['/collections/Media.ts']).toBe(collectionSource)
      expect(sources['/payload.config.ts']).toContain('sharpTransformer({ sharp })')
      expect(notes).toContainEqual(
        expect.stringContaining(
          "/collections/Media.ts: collection 'media''s `upload.imageSizes` refers to `sizes`",
        ),
      )
    })

    it('should move Sharp options out of a collection declared as a variable in the config file', async () => {
      const { sources } = await runTransformOnFiles({
        files: {
          '/payload.config.ts': `import { buildConfig } from 'payload'

const Media = {
  slug: 'media',
  fields: [],
  upload: { crop: false },
}

export default buildConfig({
  collections: [Media],
})
`,
        },
      })

      expect(sources['/payload.config.ts']).toContain('upload: {}')
      expect(sources['/payload.config.ts']).toContain(
        'sharpTransformer({ collections: { media: { crop: false } } })',
      )
    })

    it('should keep a quoted key for an imported collection whose slug constant is not a plain identifier', async () => {
      const { sources } = await runTransformOnFiles({
        files: {
          '/collections/Media.ts': `const mediaSlug = 'site-media'

export const Media = {
  slug: mediaSlug,
  fields: [],
  upload: { crop: false },
}
`,
          '/payload.config.ts': splitConfig(),
        },
      })

      expect(sources['/payload.config.ts']).toContain(
        "collections: { 'site-media': { crop: false } }",
      )
    })

    it('should still report a collection it cannot resolve to an object literal', async () => {
      const { notes } = await runTransformOnFiles({
        files: {
          '/payload.config.ts': `import { buildConfig } from 'payload'
import sharp from 'sharp'

import { createMedia } from './collections/createMedia'

export default buildConfig({
  collections: [createMedia()],
  sharp,
})
`,
        },
      })

      expect(notes).toContainEqual(
        expect.stringContaining(
          'a collection in `collections` (`createMedia()`) is defined externally',
        ),
      )
    })

    it('should be idempotent on a migrated split project', async () => {
      const files = {
        '/collections/Media.ts': `export const Media = {
  slug: 'media',
  fields: [],
  upload: { imageSizes: [{ name: 'thumbnail', width: 300 }] },
}
`,
        '/payload.config.ts': splitConfig(),
      }
      const { sources: migrated } = await runTransformOnFiles({ files })
      const { filesChanged, sources: rerun } = await runTransformOnFiles({ files: migrated })

      expect(rerun).toEqual(migrated)
      expect(filesChanged).toEqual([])
    })
  })
})

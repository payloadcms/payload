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

  it('no-ops when a sharpTransformer is already registered (idempotency on partial migration)', async () => {
    const alreadyMigrated = `import { sharpTransformer } from '@payloadcms/transformer-sharp'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        imageSizes: [{ name: 'square', height: 400, width: 400 }],
      },
    },
  ],
  upload: {
    transformers: [sharpTransformer({ collections: { media: { imageSizes: [{ name: 'square', height: 400, width: 400 }] } } })],
  },
})
`
    const project = new (await import('ts-morph')).Project({ useInMemoryFileSystem: true })
    project.createSourceFile('input.ts', alreadyMigrated)

    const result = await migrateSharpToTransformer.apply({ packageJsons: [], project })

    expect(result.filesChanged).toEqual([])
    expect(result.notes).toBeUndefined()
  })

  it('notes a leftover top-level sharp property even when a sharpTransformer call already exists', async () => {
    const alreadyMigratedWithLeftoverSharp = `import sharp from 'sharp'
import { sharpTransformer } from '@payloadcms/transformer-sharp'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        imageSizes: [{ name: 'square', height: 400, width: 400 }],
      },
    },
  ],
  upload: {
    transformers: [sharpTransformer({ collections: { media: { imageSizes: [{ name: 'square', height: 400, width: 400 }] } } })],
  },
  sharp,
})
`
    const project = new (await import('ts-morph')).Project({ useInMemoryFileSystem: true })
    project.createSourceFile('input.ts', alreadyMigratedWithLeftoverSharp)

    const result = await migrateSharpToTransformer.apply({ packageJsons: [], project })

    expect(result.notes?.some((note) => note.includes('sharp'))).toBe(true)
  })

  it('notes when a buildConfig call argument is not an inline object literal', async () => {
    const input = `import { buildConfig } from 'payload'
import { myConfig } from './myConfig.js'

export default buildConfig(myConfig)
`
    const project = new (await import('ts-morph')).Project({ useInMemoryFileSystem: true })
    project.createSourceFile('input.ts', input)

    const result = await migrateSharpToTransformer.apply({ packageJsons: [], project })

    expect(result.filesChanged).toEqual([])
    expect(result.notes?.some((note) => note.includes('buildConfig'))).toBe(true)
  })

  it('notes when upload is a shorthand property instead of duplicating the key', async () => {
    const input = `import sharp from 'sharp'
import { buildConfig } from 'payload'

const upload = { staticDir: 'media' }

export default buildConfig({
  collections: [],
  upload,
  sharp,
})
`
    const project = new (await import('ts-morph')).Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('input.ts', input)

    const result = await migrateSharpToTransformer.apply({ packageJsons: [], project })

    expect(result.notes?.some((note) => note.includes('upload'))).toBe(true)
    expect(file.getFullText()).not.toMatch(/upload,\s*\n\s*upload:/)
  })

  it('notes when a collection upload object contains a spread that may hide Sharp-specific fields', async () => {
    const input = `import sharp from 'sharp'
import { buildConfig } from 'payload'
import { sharedUploadConfig } from './sharedUploadConfig.js'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        ...sharedUploadConfig,
        staticDir: 'media',
      },
    },
  ],
  sharp,
})
`
    const project = new (await import('ts-morph')).Project({ useInMemoryFileSystem: true })
    project.createSourceFile('input.ts', input)

    const result = await migrateSharpToTransformer.apply({ packageJsons: [], project })

    expect(result.notes?.some((note) => note.includes('spread'))).toBe(true)
  })

  it('surfaces an install reminder only when a file actually changed', async () => {
    const project = new (await import('ts-morph')).Project({ useInMemoryFileSystem: true })
    const changedFile = project.createSourceFile('changed.ts', await fixture('basic.input.ts'))
    project.createSourceFile('unrelated.ts', await fixture('no-match.input.ts'))

    const result = await migrateSharpToTransformer.apply({ packageJsons: [], project })

    expect(result.filesChanged).toEqual([changedFile.getFilePath()])
    expect(
      result.notes?.some((note) => note.includes('pnpm add @payloadcms/transformer-sharp')),
    ).toBe(true)
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

  it('emits a plain identifier key for an identifier-safe slug and bracket notation for one that is not', async () => {
    const input = `import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        imageSizes: [{ name: 'square', height: 400, width: 400 }],
      },
    },
    {
      slug: 'my-media',
      fields: [],
      upload: {
        imageSizes: [{ name: 'square', height: 400, width: 400 }],
      },
    },
  ],
})
`
    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toContain('media: {')
    expect(result).not.toContain("['media']")
    expect(result).toContain("['my-media']")
  })

  it('emits shorthand sharp instead of sharp: sharp for the default import/variable name', async () => {
    const input = `import sharp from 'sharp'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  sharp,
})
`
    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toContain('sharpTransformer({ sharp })')
    expect(result).not.toContain('sharp: sharp')
  })

  it('matches the surrounding file semicolon-free import style when inserting the sharpTransformer import', async () => {
    const input = await fixture('basic.input.ts')

    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toContain("import { sharpTransformer } from '@payloadcms/transformer-sharp'\n")
    expect(result).not.toContain(
      "import { sharpTransformer } from '@payloadcms/transformer-sharp';",
    )
  })

  it('collapses a collection upload object to `{}` on one line when its last property is moved out', async () => {
    const input = await fixture('existing-transformers.input.ts')

    const result = await runTransform({ source: input, transform: migrateSharpToTransformer })

    expect(result).toContain('upload: {},')
    expect(result).not.toMatch(/upload: {\s*\n\s*},/)
  })

  it('leaves a dynamically-produced collections array untouched and notes it for manual migration', async () => {
    const input = `import sharp from 'sharp'
import { buildConfig } from 'payload'
import { getCollections } from './getCollections.js'

export default buildConfig({
  collections: getCollections(),
  sharp,
})
`
    const project = new (await import('ts-morph')).Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('input.ts', input)

    const result = await migrateSharpToTransformer.apply({ packageJsons: [], project })

    expect(result.filesChanged).toContain(file.getFilePath())
    expect(result.notes?.some((note) => note.includes('collections'))).toBe(true)
  })
})

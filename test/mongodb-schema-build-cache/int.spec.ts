import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { IndexDirection, IndexOptions, Schema } from 'mongoose'
import type { FlattenedField, Payload, SanitizedConfig } from 'payload'

import { reload } from 'payload'
import { expect } from 'vitest'

import type { SchemaCachePage } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import {
  leafBlockSlug,
  leftBlockSlug,
  numericTargetsSlug,
  pagesSlug,
  rootBlockSlug,
} from './config.js'

type NestedLayout = NonNullable<SchemaCachePage['layout']>

test.suite({ config: './config.ts', db: 'mongo' })('MongoDB schema build cache', () => {
  test('should create and read nested referenced blocks', async ({ payload }) => {
    const target = await createTarget({ payload })
    const page = await payload.create({
      collection: pagesSlug,
      data: {
        layout: createNestedLayout({ targetID: target.id, value: 'initial value' }),
        title: 'Nested blocks',
      },
      depth: 0,
      locale: 'en',
    })

    const result = await payload.findByID({
      id: page.id,
      collection: pagesSlug,
      depth: 0,
      locale: 'en',
    })
    const leaf = getFirstLeaf(result.layout)

    expect(leaf.value).toBe('initial value')
    expect(leaf.localizedText).toBe('English leaf')
    expect(leaf.location).toEqual([10, 20])
  })

  test('should update a value inside a nested referenced block', async ({ payload }) => {
    const target = await createTarget({ payload })
    const page = await payload.create({
      collection: pagesSlug,
      data: {
        layout: createNestedLayout({ targetID: target.id, value: 'before update' }),
        title: 'Update nested blocks',
      },
      depth: 0,
      locale: 'en',
    })

    const result = await payload.update({
      id: page.id,
      collection: pagesSlug,
      data: {
        layout: createNestedLayout({ targetID: target.id, value: 'after update' }),
      },
      depth: 0,
      locale: 'en',
    })

    expect(getFirstLeaf(result.layout).value).toBe('after update')
  })

  test('should keep localized nested blocks independent in en and de', async ({ payload }) => {
    const target = await createTarget({ payload })
    const page = await payload.create({
      collection: pagesSlug,
      data: {
        localizedLayout: createNestedLayout({
          localizedText: 'English localized leaf',
          targetID: target.id,
          value: 'English value',
        }),
        title: 'Localized nested blocks',
      },
      locale: 'en',
    })

    await payload.update({
      id: page.id,
      collection: pagesSlug,
      data: {
        localizedLayout: createNestedLayout({
          localizedText: 'German localized leaf',
          targetID: target.id,
          value: 'German value',
        }),
      },
      locale: 'de',
    })

    const result = await payload.findByID({
      id: page.id,
      collection: pagesSlug,
      depth: 0,
      locale: 'all',
    })
    const localizedLayout = result.localizedLayout as unknown as {
      de: NestedLayout
      en: NestedLayout
    }

    expect(getFirstLeaf(localizedLayout.en).localizedText).toBe('English localized leaf')
    expect(getFirstLeaf(localizedLayout.de).localizedText).toBe('German localized leaf')
  })

  test('should create and read a version with nested referenced blocks', async ({ payload }) => {
    const target = await createTarget({ payload })
    const page = await payload.create({
      collection: pagesSlug,
      data: {
        layout: createNestedLayout({ targetID: target.id, value: 'version value' }),
        title: 'Versioned nested blocks',
      },
      depth: 0,
      draft: true,
      locale: 'en',
    })

    const versions = await payload.findVersions({
      collection: pagesSlug,
      depth: 0,
      locale: 'en',
      where: {
        parent: {
          equals: page.id,
        },
      },
    })

    expect(versions.docs.length).toBeGreaterThan(0)
    expect(getFirstLeaf(versions.docs[0]!.version.layout).value).toBe('version value')
  })

  test('should preserve numeric relationship values inside cached blocks', async ({ payload }) => {
    const target = await createTarget({ payload })
    const page = await payload.create({
      collection: pagesSlug,
      data: {
        layout: createNestedLayout({ targetID: target.id, value: 'numeric relationship' }),
        title: 'Numeric relationship',
      },
      depth: 0,
      locale: 'en',
    })

    expect(target.id).toBeTypeOf('number')
    expect(getFirstLeaf(page.layout).target).toBe(target.id)
    expect(getFirstLeaf(page.layout).target).toBeTypeOf('number')
  })

  test('should preserve unique and geospatial index definitions', ({ payload }) => {
    const leafSchema = getCompiledLeafSchema({ payload })
    const indexes = leafSchema.indexes() as [Record<string, IndexDirection>, IndexOptions][]
    const indexesByPath = Object.fromEntries(
      indexes.map(([definition, options]) => [Object.keys(definition)[0], { definition, options }]),
    )

    expect(indexesByPath.uniqueText).toMatchObject({
      definition: { uniqueText: 1 },
      options: { sparse: true, unique: true },
    })
    expect(indexesByPath.location).toMatchObject({
      definition: { location: '2dsphere' },
    })
  })

  test('should rebuild block templates after a configuration reload', async ({
    config,
    payload,
  }) => {
    const secondConfigField: FlattenedField = { name: 'secondConfigValue', type: 'text' }
    const alternateConfig: SanitizedConfig = {
      ...config,
      blocks: config.blocks.map((block) =>
        block.slug === leafBlockSlug
          ? {
              ...block,
              fields: [...block.fields, secondConfigField],
              flattenedFields: [...block.flattenedFields, secondConfigField],
            }
          : block,
      ),
    }

    try {
      await reload(alternateConfig, payload, true, {
        config: alternateConfig,
        disableDBConnect: true,
      })

      expect(getCompiledLeafSchema({ payload }).path('secondConfigValue')).toBeDefined()
    } finally {
      await reload(config, payload, true, { config, disableDBConnect: true })
    }
  })
})

const createNestedLayout = ({
  localizedText = 'English leaf',
  targetID,
  value,
}: {
  localizedText?: string
  targetID: number
  value: string
}): NestedLayout => [
  {
    blockType: rootBlockSlug,
    branches: [
      {
        blockType: leftBlockSlug,
        leaves: [
          {
            blockType: leafBlockSlug,
            localizedText,
            location: [10, 20],
            target: targetID,
            uniqueText: `${value} unique`,
            value,
          },
        ],
      },
    ],
  },
]

const createTarget = async ({
  payload,
}: {
  payload: Parameters<typeof getCompiledLeafSchema>[0]['payload']
}) =>
  payload.create({
    collection: numericTargetsSlug,
    data: {
      id: 100,
      title: 'Numeric target',
    },
  })

const getFirstLeaf = (layout: NestedLayout | null | undefined) => {
  const root = layout?.[0]

  if (!root || root.blockType !== rootBlockSlug) {
    throw new Error('Expected the first layout item to be the root block.')
  }

  const branch = root.branches?.[0]

  if (!branch || branch.blockType !== leftBlockSlug) {
    throw new Error('Expected the first branch to be the left block.')
  }

  const leaf = branch.leaves?.[0]

  if (!leaf || leaf.blockType !== leafBlockSlug) {
    throw new Error('Expected the first nested item to be the leaf block.')
  }

  return leaf
}

const getCompiledLeafSchema = ({ payload }: { payload: Payload }): Schema => {
  const pagesModel = (payload.db as unknown as MongooseAdapter).collections[pagesSlug]

  if (!pagesModel) {
    throw new Error(`Expected a compiled model for ${pagesSlug}.`)
  }

  const pagesSchema = pagesModel.schema
  const rootSchema = getDiscriminator({ slug: rootBlockSlug, path: 'layout', schema: pagesSchema })
  const leftSchema = getDiscriminator({ slug: leftBlockSlug, path: 'branches', schema: rootSchema })

  return getDiscriminator({ slug: leafBlockSlug, path: 'leaves', schema: leftSchema })
}

const getDiscriminator = ({
  slug,
  path,
  schema,
}: {
  path: string
  schema: Schema
  slug: string
}): Schema => {
  const discriminator = (
    schema.path(path) as unknown as {
      schema: { discriminators?: Record<string, Schema> }
    }
  ).schema.discriminators?.[slug]

  if (!discriminator) {
    throw new Error(`Expected ${slug} discriminator at ${path}.`)
  }

  return discriminator
}

import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { IndexDirection, IndexOptions, Schema } from 'mongoose'
import type { FlattenedField, Payload, SanitizedConfig } from 'payload'

import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reload } from 'payload'
import { afterAll, afterEach, beforeAll } from 'vitest'

import type { SchemaCachePage } from './payload-types.js'

import { describe, it as test } from '../__helpers/int/vitest.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  leafBlockSlug,
  leftBlockSlug,
  numericTargetsSlug,
  pagesSlug,
  rootBlockSlug,
} from './config.js'

type NestedLayout = NonNullable<SchemaCachePage['layout']>

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let config: SanitizedConfig
const createdPageIDs: SchemaCachePage['id'][] = []
const createdTargetIDs: number[] = []
let nextTargetID = 100
let payload: Payload

describe('MongoDB schema build cache', { db: 'mongo' }, () => {
  beforeAll(async () => {
    ;({ config, payload } = await initPayloadInt(dirname))
  })

  afterEach(async () => {
    for (const id of createdPageIDs) {
      await payload.delete({ collection: pagesSlug, id, overrideAccess: true })
    }
    createdPageIDs.length = 0

    for (const id of createdTargetIDs) {
      await payload.delete({ collection: numericTargetsSlug, id, overrideAccess: true })
    }
    createdTargetIDs.length = 0
  })

  afterAll(async () => {
    await payload.destroy()
  })

  test('should create and read nested referenced blocks', async () => {
    const target = await createTarget({ payload })
    const page = await payload.create({
      collection: pagesSlug,
      data: {
        layout: createNestedLayout({ targetID: target.id, value: 'initial value' }),
        title: 'Nested blocks',
      },
      depth: 0,
      locale: 'en',
      overrideAccess: true,
    })
    createdPageIDs.push(page.id)

    const result = await payload.findByID({
      id: page.id,
      collection: pagesSlug,
      depth: 0,
      locale: 'en',
      overrideAccess: true,
    })
    const leaf = getFirstLeaf(result.layout)

    assert.equal(leaf.value, 'initial value')
    assert.equal(leaf.localizedText, 'English leaf')
    assert.deepEqual(leaf.location, [10, 20])
  })

  test('should update a value inside a nested referenced block', async () => {
    const target = await createTarget({ payload })
    const page = await payload.create({
      collection: pagesSlug,
      data: {
        layout: createNestedLayout({ targetID: target.id, value: 'before update' }),
        title: 'Update nested blocks',
      },
      depth: 0,
      locale: 'en',
      overrideAccess: true,
    })
    createdPageIDs.push(page.id)

    const result = await payload.update({
      id: page.id,
      collection: pagesSlug,
      data: {
        layout: createNestedLayout({ targetID: target.id, value: 'after update' }),
      },
      depth: 0,
      locale: 'en',
      overrideAccess: true,
    })

    assert.equal(getFirstLeaf(result.layout).value, 'after update')
  })

  test('should keep localized nested blocks independent in en and de', async () => {
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
      overrideAccess: true,
    })
    createdPageIDs.push(page.id)

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
      overrideAccess: true,
    })

    const result = await payload.findByID({
      id: page.id,
      collection: pagesSlug,
      depth: 0,
      locale: 'all',
      overrideAccess: true,
    })
    const localizedLayout = result.localizedLayout as unknown as {
      de: NestedLayout
      en: NestedLayout
    }

    assert.equal(getFirstLeaf(localizedLayout.en).localizedText, 'English localized leaf')
    assert.equal(getFirstLeaf(localizedLayout.de).localizedText, 'German localized leaf')
  })

  test('should create and read a version with nested referenced blocks', async () => {
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
      overrideAccess: true,
    })
    createdPageIDs.push(page.id)

    const versions = await payload.findVersions({
      collection: pagesSlug,
      depth: 0,
      locale: 'en',
      overrideAccess: true,
      where: {
        parent: {
          equals: page.id,
        },
      },
    })

    assert.ok(versions.docs.length > 0)
    assert.equal(getFirstLeaf(versions.docs[0]!.version.layout).value, 'version value')
  })

  test('should preserve numeric relationship values inside cached blocks', async () => {
    const target = await createTarget({ payload })
    const page = await payload.create({
      collection: pagesSlug,
      data: {
        layout: createNestedLayout({ targetID: target.id, value: 'numeric relationship' }),
        title: 'Numeric relationship',
      },
      depth: 0,
      locale: 'en',
      overrideAccess: true,
    })
    createdPageIDs.push(page.id)

    assert.equal(typeof target.id, 'number')
    assert.equal(getFirstLeaf(page.layout).target, target.id)
    assert.equal(typeof getFirstLeaf(page.layout).target, 'number')
  })

  test('should preserve unique and geospatial index definitions', () => {
    const leafSchema = getCompiledLeafSchema({ payload })
    const indexes = leafSchema.indexes() as [Record<string, IndexDirection>, IndexOptions][]
    const indexesByPath = Object.fromEntries(
      indexes.map(([definition, options]) => [Object.keys(definition)[0], { definition, options }]),
    )

    assert.deepEqual(indexesByPath.uniqueText?.definition, { uniqueText: 1 })
    assert.equal(indexesByPath.uniqueText?.options.sparse, true)
    assert.equal(indexesByPath.uniqueText?.options.unique, true)
    assert.deepEqual(indexesByPath.location?.definition, { location: '2dsphere' })
  })

  test('should rebuild block templates after a configuration reload', async () => {
    const secondConfigField: FlattenedField = { name: 'secondConfigValue', type: 'text' }
    const alternateConfig: SanitizedConfig = {
      ...config,
      blocks: (config.blocks ?? []).map((block) =>
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

      assert.ok(getCompiledLeafSchema({ payload }).path('secondConfigValue'))
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
}) => {
  const target = await payload.create({
    collection: numericTargetsSlug,
    data: {
      id: nextTargetID++,
      title: 'Numeric target',
    },
    overrideAccess: true,
  })

  createdTargetIDs.push(target.id)

  return target
}

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

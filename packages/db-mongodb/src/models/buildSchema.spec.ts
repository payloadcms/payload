import type { Block, BlockSlug, Field, Payload } from 'payload'
import type { Schema } from 'mongoose'

import { createSchemaBuildContext } from 'payload/internal'
import { describe, expect, test } from 'vitest'

import type { BuildSchemaOptions } from './buildSchema.js'
import type { MongoSchemaBuildContext } from './schemaBuildContext.js'

import { buildSchema } from './buildSchema.js'
import { getBlockSchemaCacheKey } from './schemaBuildContext.js'

type BlockVariant = {
  disableUnique: boolean
  draftsEnabled: boolean
  indexSortableFields: boolean
  isLocalized: boolean
}

type DescribedSchema = {
  discriminators: string[]
  indexes: ReturnType<Schema['indexes']>
  options: {
    _id?: boolean
    discriminatorKey?: string
    id?: boolean
    minimize?: boolean
  }
  paths: Array<{ instance: string; path: string }>
}

const buildSchemaWithContext = buildSchema as (
  args: Parameters<typeof buildSchema>[0] & {
    schemaBuildContext: MongoSchemaBuildContext
  },
) => Schema

describe('MongoDB schema build context', () => {
  test('should name referenced blocks by slug and version before schema settings', () => {
    expect(
      getBlockSchemaCacheKey({
        blockSlug: 'hero',
        buildSchemaOptions: {},
        fieldPath: 'collection:posts/field:layout',
        isLocalized: false,
        isReference: true,
        isVersion: false,
      }),
    ).toBe('block:hero')

    expect(
      getBlockSchemaCacheKey({
        blockSlug: 'hero',
        buildSchemaOptions: { disableUnique: true, draftsEnabled: true },
        fieldPath: 'collection:posts/field:layout',
        isLocalized: false,
        isReference: true,
        isVersion: true,
      }),
    ).toBe('block:hero-version|disableUnique:true|draftsEnabled:true')
  })

  test('should identify inline blocks by owner and full nested field path', () => {
    expect(
      getBlockSchemaCacheKey({
        blockSlug: 'card',
        buildSchemaOptions: {},
        fieldPath: 'collection:posts/field:sections/block:hero/field:cards',
        isLocalized: false,
        isReference: false,
        isVersion: false,
      }),
    ).toBe('inline:collection:posts/field:sections/block:hero/field:cards/block:card')
  })

  test('should reuse a referenced block next to inline blocks in different fields', () => {
    const shared: Block = { slug: 'shared', fields: [{ name: 'text', type: 'text' }] }
    const inline: Block = { slug: 'inline', fields: [{ name: 'text', type: 'text' }] }
    const { builds, context } = createRecordedSchemaBuildContext()

    buildSchemaWithContext({
      buildSchemaOptions: {},
      configFields: [
        { name: 'first', type: 'blocks', blocks: [inline, 'shared' as BlockSlug] },
        { name: 'second', type: 'blocks', blocks: ['shared' as BlockSlug] },
      ],
      payload: createPayloadFixture({ blocks: [shared] }),
      schemaBuildContext: context,
      schemaPath: 'collection:posts',
    })

    expect(builds.filter(({ label }) => label === 'block:shared')).toHaveLength(1)
    expect(builds.map(({ label }) => label)).toContain(
      'inline:collection:posts/field:first/block:inline',
    )
  })

  test('should include nested group and array names in inline block keys', () => {
    const inline: Block = { slug: 'card', fields: [{ name: 'text', type: 'text' }] }
    const { builds, context } = createRecordedSchemaBuildContext()

    buildSchemaWithContext({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'content',
          type: 'group',
          fields: [
            {
              name: 'items',
              type: 'array',
              fields: [{ name: 'layout', type: 'blocks', blocks: [inline] }],
            },
          ],
        },
      ],
      payload: createPayloadFixture({ blocks: [] }),
      schemaBuildContext: context,
      schemaPath: 'collection:posts',
    })

    expect(builds.map(({ label }) => label)).toContain(
      'inline:collection:posts/field:content/field:items/field:layout/block:card',
    )
  })

  test('should normalize false and undefined in block variant keys', () => {
    expect(
      getBlockSchemaCacheKey({
        blockSlug: 'hero',
        buildSchemaOptions: {},
        fieldPath: 'collection:posts/field:layout',
        isLocalized: false,
        isReference: true,
        isVersion: false,
      }),
    ).toBe(
      getBlockSchemaCacheKey({
        blockSlug: 'hero',
        buildSchemaOptions: {
          disableUnique: false,
          draftsEnabled: false,
          indexSortableFields: false,
        },
        fieldPath: 'collection:posts/field:layout',
        isLocalized: false,
        isReference: true,
        isVersion: false,
      }),
    )
  })

  test.each([
    { buildSchemaOptions: { disableUnique: true }, isLocalized: false },
    { buildSchemaOptions: { draftsEnabled: true }, isLocalized: false },
    { buildSchemaOptions: { indexSortableFields: true }, isLocalized: false },
    { buildSchemaOptions: {}, isLocalized: true },
  ])('should include every schema input in the block variant key', (changedVariant) => {
    const baseKey = getBlockSchemaCacheKey({
      blockSlug: 'hero',
      buildSchemaOptions: {},
      fieldPath: 'collection:posts/field:layout',
      isLocalized: false,
      isReference: true,
      isVersion: false,
    })

    expect(
      getBlockSchemaCacheKey({
        blockSlug: 'hero',
        fieldPath: 'collection:posts/field:layout',
        isReference: true,
        isVersion: false,
        ...changedVariant,
      }),
    ).not.toBe(baseKey)
  })

  test('should build a diamond graph once per block and variant', () => {
    const blocks = createDiamondBlockGraph()
    const payload = createPayloadFixture({ blocks })
    const { builds, context } = createRecordedSchemaBuildContext()
    const schema = buildSchemaWithContext({
      buildSchemaOptions: {},
      configFields: createRootFields(),
      payload,
      schemaBuildContext: context,
    })

    expect(builds.filter(({ label }) => label === 'block:leaf')).toHaveLength(1)
    expect(builds.filter(({ label }) => label === 'block:root')).toHaveLength(1)
    expect(getBlockDiscriminator({ path: 'layoutA', schema, slug: 'root' })).toBeDefined()
    expect(getBlockDiscriminator({ path: 'layoutB', schema, slug: 'root' })).toBeDefined()
  })

  test.each<BlockVariant>([
    {
      disableUnique: false,
      draftsEnabled: false,
      indexSortableFields: false,
      isLocalized: false,
    },
    {
      disableUnique: true,
      draftsEnabled: true,
      indexSortableFields: false,
      isLocalized: false,
    },
    {
      disableUnique: false,
      draftsEnabled: false,
      indexSortableFields: true,
      isLocalized: false,
    },
    {
      disableUnique: false,
      draftsEnabled: false,
      indexSortableFields: false,
      isLocalized: true,
    },
  ])('should preserve the complete schema for $variant', (variant) => {
    const blocks = createCompleteBlockGraph()
    const payload = createPayloadFixture({ blocks, customIDType: 'number' })
    const sharedContext = createSchemaBuildContext<Schema>()

    buildVariantSchema({ context: sharedContext, payload, variant })
    const cachedSchema = buildVariantSchema({ context: sharedContext, payload, variant })
    const independentSchema = buildVariantSchema({
      context: createSchemaBuildContext<Schema>(),
      payload,
      variant,
    })

    expect(describeSchema(cachedSchema)).toEqual(describeSchema(independentSchema))
  })

  test('should not share schemas between configs that reuse a block object', () => {
    const sharedBlock: Block = {
      slug: 'shared',
      fields: [{ name: 'localizedText', type: 'text', localized: true }],
    }
    const { builds: englishBuilds, context: englishContext } = createRecordedSchemaBuildContext()
    const { builds: multilingualBuilds, context: multilingualContext } =
      createRecordedSchemaBuildContext()

    buildDirectBlockSchema({
      block: sharedBlock,
      context: englishContext,
      payload: createPayloadFixture({ blocks: [sharedBlock], locales: ['en'] }),
    })
    buildDirectBlockSchema({
      block: sharedBlock,
      context: multilingualContext,
      payload: createPayloadFixture({ blocks: [sharedBlock], locales: ['en', 'de'] }),
    })

    expect(englishBuilds).toHaveLength(1)
    expect(multilingualBuilds).toHaveLength(1)
    expect(englishBuilds[0]?.schema).not.toBe(multilingualBuilds[0]?.schema)
    expect(describeSchema(englishBuilds[0]!.schema).paths.map(({ path }) => path)).toContain(
      'localizedText.en',
    )
    expect(describeSchema(multilingualBuilds[0]!.schema).paths.map(({ path }) => path)).toContain(
      'localizedText.de',
    )
  })

  test('should create separate templates for localized and nonlocalized placements', () => {
    const block: Block = { slug: 'shared', fields: [{ name: 'text', type: 'text' }] }
    const { builds, context } = createRecordedSchemaBuildContext()

    buildSchemaWithContext({
      buildSchemaOptions: {},
      configFields: [
        { name: 'plain', type: 'blocks', blocks: ['shared' as BlockSlug] },
        { name: 'localized', type: 'blocks', blocks: ['shared' as BlockSlug], localized: true },
      ],
      payload: createPayloadFixture({ blocks: [block] }),
      schemaBuildContext: context,
    })

    expect(builds.map(({ variantKey }) => variantKey)).toEqual([
      'block:shared',
      'block:shared|isLocalized:true',
    ])
  })

  test('should create separate templates for live and version schemas', () => {
    const block: Block = { slug: 'shared', fields: [{ name: 'text', type: 'text' }] }
    const payload = createPayloadFixture({ blocks: [block] })
    const { builds, context } = createRecordedSchemaBuildContext()

    buildDirectBlockSchema({ block, context, payload })
    buildDirectBlockSchema({
      block,
      buildSchemaOptions: { disableUnique: true, draftsEnabled: true },
      context,
      isVersion: true,
      payload,
    })

    expect(builds.map(({ variantKey }) => variantKey)).toEqual([
      'block:shared',
      'block:shared-version|disableUnique:true|draftsEnabled:true',
    ])
  })

  test.each([
    { customIDType: 'number', expectedInstance: 'Number', useBigIntForNumberIDs: false },
    { customIDType: 'number', expectedInstance: 'BigInt', useBigIntForNumberIDs: true },
    { customIDType: 'text', expectedInstance: 'String', useBigIntForNumberIDs: false },
  ] as const)(
    'should preserve $expectedInstance relationship IDs in separate contexts',
    ({ customIDType, expectedInstance, useBigIntForNumberIDs }) => {
      const block: Block = {
        slug: 'relationship-block',
        fields: [{ name: 'target', type: 'relationship', relationTo: 'targets' }],
      }
      const schema = buildDirectBlockSchema({
        block,
        context: createSchemaBuildContext<Schema>(),
        payload: createPayloadFixture({
          blocks: [block],
          customIDType,
          useBigIntForNumberIDs,
        }),
      })
      const blockSchema = getBlockDiscriminator({
        path: 'layout',
        schema,
        slug: 'relationship-block',
      })

      expect(blockSchema?.path('target').instance).toBe(expectedInstance)
    },
  )

  test('should keep cloned block registrations independent after template reuse', () => {
    const blocks = createDiamondBlockGraph()
    const schema = buildSchemaWithContext({
      buildSchemaOptions: {},
      configFields: createRootFields(),
      payload: createPayloadFixture({ blocks }),
      schemaBuildContext: createSchemaBuildContext<Schema>(),
    })
    const firstRoot = getBlockDiscriminator({ path: 'layoutA', schema, slug: 'root' })!
    const secondRoot = getBlockDiscriminator({ path: 'layoutB', schema, slug: 'root' })!

    expect(firstRoot).not.toBe(secondRoot)
    expect(describeSchema(firstRoot)).toEqual(describeSchema(secondRoot))

    firstRoot.add({ firstParentOnly: String })

    expect(firstRoot.path('firstParentOnly')).toBeDefined()
    expect(secondRoot.path('firstParentOnly')).toBeUndefined()
  })

  test('should separate inline blocks by field path and object identity', () => {
    const sharedInlineBlock: Block = { slug: 'inline', fields: [{ name: 'text', type: 'text' }] }
    const separateInlineBlock: Block = { slug: 'inline', fields: [{ name: 'text', type: 'text' }] }
    const { builds, context } = createRecordedSchemaBuildContext()

    buildSchemaWithContext({
      buildSchemaOptions: {},
      configFields: [
        { name: 'first', type: 'blocks', blocks: [sharedInlineBlock] },
        { name: 'second', type: 'blocks', blocks: [sharedInlineBlock] },
        { name: 'third', type: 'blocks', blocks: [separateInlineBlock] },
      ],
      payload: createPayloadFixture({ blocks: [] }),
      schemaBuildContext: context,
    })

    expect(builds.filter(({ label }) => label.startsWith('inline:'))).toHaveLength(3)
  })

  test('should leave compiled model schemas usable after context.clear()', () => {
    const blocks = createDiamondBlockGraph()
    const context = createSchemaBuildContext<Schema>()
    const schema = buildSchemaWithContext({
      buildSchemaOptions: {},
      configFields: createRootFields(),
      payload: createPayloadFixture({ blocks }),
      schemaBuildContext: context,
    })
    const beforeClear = describeSchema(schema)

    context.clear()

    expect(describeSchema(schema)).toEqual(beforeClear)
    expect(getBlockDiscriminator({ path: 'layoutA', schema, slug: 'root' })).toBeDefined()
  })
})

const createRecordedSchemaBuildContext = (): {
  builds: Array<{ label: string; schema: Schema; variantKey: string }>
  context: MongoSchemaBuildContext
} => {
  const cacheContext = createSchemaBuildContext<Schema>()
  const builds: Array<{ label: string; schema: Schema; variantKey: string }> = []

  return {
    builds,
    context: {
      clear: cacheContext.clear,
      getOrCreate: (args) =>
        cacheContext.getOrCreate({
          ...args,
          build: () => {
            const schema = args.build()

            builds.push({
              label: args.cacheKey.split('|')[0]!,
              schema,
              variantKey: args.cacheKey,
            })

            return schema
          },
        }),
    },
  }
}

const buildDirectBlockSchema = ({
  block,
  buildSchemaOptions = {},
  context,
  isVersion = false,
  payload,
}: {
  block: Block
  buildSchemaOptions?: BuildSchemaOptions
  context: MongoSchemaBuildContext
  isVersion?: boolean
  payload: Payload
}): Schema =>
  buildSchemaWithContext({
    buildSchemaOptions,
    configFields: [{ name: 'layout', type: 'blocks', blocks: [block.slug as BlockSlug] }],
    isVersion,
    payload,
    schemaBuildContext: context,
  })

const buildVariantSchema = ({
  context,
  payload,
  variant,
}: {
  context: MongoSchemaBuildContext
  payload: Payload
  variant: BlockVariant
}): Schema =>
  buildSchemaWithContext({
    buildSchemaOptions: {
      disableUnique: variant.disableUnique,
      draftsEnabled: variant.draftsEnabled,
      indexSortableFields: variant.indexSortableFields,
    },
    configFields: [
      {
        name: 'layout',
        type: 'blocks',
        blocks: ['root' as BlockSlug],
        localized: variant.isLocalized,
      },
    ],
    payload,
    schemaBuildContext: context,
  })

const createCompleteBlockGraph = (): Block[] => {
  const [leaf, left, right, root] = createDiamondBlockGraph()

  return [
    {
      ...leaf!,
      fields: [
        { name: 'requiredText', type: 'text', required: true },
        { name: 'uniqueText', type: 'text', unique: true },
        { name: 'choice', type: 'select', options: ['one', 'two'] },
        { name: 'location', type: 'point' },
        { name: 'items', type: 'array', fields: [{ name: 'value', type: 'text' }] },
        { name: 'group', type: 'group', fields: [{ name: 'value', type: 'number' }] },
        { type: 'tabs', tabs: [{ name: 'tab', fields: [{ name: 'value', type: 'text' }] }] },
        { name: 'target', type: 'relationship', relationTo: 'targets' },
      ],
    },
    left!,
    right!,
    root!,
  ]
}

const createDiamondBlockGraph = (): Block[] => [
  { slug: 'leaf', fields: [{ name: 'text', type: 'text' }] },
  {
    slug: 'left',
    fields: [{ name: 'leaves', type: 'blocks', blocks: ['leaf' as BlockSlug] }],
  },
  {
    slug: 'right',
    fields: [{ name: 'leaves', type: 'blocks', blocks: ['leaf' as BlockSlug] }],
  },
  {
    slug: 'root',
    fields: [
      {
        name: 'branches',
        type: 'blocks',
        blocks: ['left' as BlockSlug, 'right' as BlockSlug],
      },
    ],
  },
]

const createPayloadFixture = ({
  blocks,
  customIDType = 'number',
  locales = ['en', 'de'],
  useBigIntForNumberIDs = false,
}: {
  blocks: Block[]
  customIDType?: 'number' | 'text'
  locales?: string[]
  useBigIntForNumberIDs?: boolean
}): Payload =>
  ({
    blocks: Object.fromEntries(blocks.map((block) => [block.slug, block])),
    collections: {
      targets: {
        customIDType,
      },
    },
    config: {
      indexSortableFields: false,
      localization: {
        defaultLocale: locales[0],
        fallback: true,
        localeCodes: locales,
        locales: locales.map((code) => ({ code, label: code })),
      },
    },
    db: {
      useBigIntForNumberIDs,
    },
  }) as unknown as Payload

const createRootFields = (): Field[] => [
  { name: 'layoutA', type: 'blocks', blocks: ['root' as BlockSlug] },
  { name: 'layoutB', type: 'blocks', blocks: ['root' as BlockSlug] },
]

const describeSchema = (schema: Schema): DescribedSchema => {
  const discriminators: string[] = []
  const paths: Array<{ instance: string; path: string }> = []
  const visited = new WeakSet<Schema>()

  const visit = (currentSchema: Schema, prefix = ''): void => {
    if (visited.has(currentSchema)) {
      return
    }

    visited.add(currentSchema)

    for (const [pathName, schemaPath] of Object.entries(currentSchema.paths)) {
      const path = prefix ? `${prefix}.${pathName}` : pathName
      const childSchema = getPathSchema(schemaPath)

      paths.push({ instance: schemaPath.instance, path })

      for (const [slug, discriminatorSchema] of Object.entries(
        (childSchema as (Schema & { discriminators?: Record<string, Schema> }) | undefined)
          ?.discriminators ?? {},
      )) {
        discriminators.push(`${path}:${slug}`)
        visit(discriminatorSchema, `${path}<${slug}>`)
      }

      if (childSchema) {
        visit(childSchema, path)
      }
    }
  }

  visit(schema)

  return {
    discriminators: discriminators.sort(),
    indexes: schema.indexes(),
    options: {
      _id: schema.options._id,
      discriminatorKey: schema.options.discriminatorKey,
      id: schema.options.id,
      minimize: schema.options.minimize,
    },
    paths: paths.sort((left, right) => left.path.localeCompare(right.path)),
  }
}

const getBlockDiscriminator = ({
  path,
  schema,
  slug,
}: {
  path: string
  schema: Schema
  slug: string
}): Schema | undefined => getDocumentArrayPath({ path, schema }).schema.discriminators?.[slug]

const getDocumentArrayPath = ({
  path,
  schema,
}: {
  path: string
  schema: Schema
}): {
  discriminator: (name: string, schema: Schema) => unknown
  schema: Schema & { discriminators?: Record<string, Schema> }
} =>
  schema.path(path) as unknown as {
    discriminator: (name: string, schema: Schema) => unknown
    schema: Schema & { discriminators?: Record<string, Schema> }
  }

const getPathSchema = (path: Schema['paths'][string]): Schema | undefined =>
  (path as typeof path & { caster?: { schema?: Schema }; schema?: Schema }).schema ??
  (path as typeof path & { caster?: { schema?: Schema }; schema?: Schema }).caster?.schema

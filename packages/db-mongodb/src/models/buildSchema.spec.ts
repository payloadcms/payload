import type { Block, BlockSlug, Field, Payload } from 'payload'
import type { Schema } from 'mongoose'

import { createSchemaBuildContext } from 'payload/internal'
import { describe, expect, test } from 'vitest'

import type { MongoSchemaBuildContext } from './schemaBuildContext.js'

import { buildSchema } from './buildSchema.js'
import { getBlockSchemaCacheKey } from './schemaBuildContext.js'

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
  test('should scope cache keys by referenced and inline placement', () => {
    const createKey = ({ fieldPath, isReference }: { fieldPath: string; isReference: boolean }) =>
      getBlockSchemaCacheKey({
        blockSlug: 'hero',
        buildSchemaOptions: {},
        fieldPath,
        isLocalized: false,
        isReference,
        isVersion: false,
      })

    const firstReferenceKey = createKey({
      fieldPath: 'collection:posts/field:first',
      isReference: true,
    })
    const secondReferenceKey = createKey({
      fieldPath: 'collection:posts/field:second',
      isReference: true,
    })
    const firstInlineKey = createKey({
      fieldPath: 'collection:posts/field:first',
      isReference: false,
    })
    const secondInlineKey = createKey({
      fieldPath: 'collection:posts/field:second',
      isReference: false,
    })

    expect(firstReferenceKey).toBe(secondReferenceKey)
    expect(firstInlineKey).not.toBe(secondInlineKey)
    expect(firstReferenceKey).not.toBe(firstInlineKey)
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
    {
      buildSchemaOptions: { disableUnique: true },
      isLocalized: false,
      isVersion: false,
      variant: 'unique handling',
    },
    {
      buildSchemaOptions: { draftsEnabled: true },
      isLocalized: false,
      isVersion: false,
      variant: 'draft handling',
    },
    {
      buildSchemaOptions: { indexSortableFields: true },
      isLocalized: false,
      isVersion: false,
      variant: 'sortable indexes',
    },
    {
      buildSchemaOptions: {},
      isLocalized: true,
      isVersion: false,
      variant: 'localization',
    },
    {
      buildSchemaOptions: {},
      isLocalized: false,
      isVersion: true,
      variant: 'versions',
    },
  ])(
    'should separate $variant in block cache keys',
    ({ buildSchemaOptions, isLocalized, isVersion }) => {
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
          buildSchemaOptions,
          fieldPath: 'collection:posts/field:layout',
          isLocalized,
          isReference: true,
          isVersion,
        }),
      ).not.toBe(baseKey)
    },
  )

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

  test('should separate a shared inline block by nested field path', () => {
    const sharedInlineBlock: Block = { slug: 'inline', fields: [{ name: 'text', type: 'text' }] }
    const { builds, context } = createRecordedSchemaBuildContext()

    buildSchemaWithContext({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'first',
          type: 'group',
          fields: [
            {
              name: 'items',
              type: 'array',
              fields: [{ name: 'layout', type: 'blocks', blocks: [sharedInlineBlock] }],
            },
          ],
        },
        {
          name: 'second',
          type: 'group',
          fields: [
            {
              name: 'items',
              type: 'array',
              fields: [{ name: 'layout', type: 'blocks', blocks: [sharedInlineBlock] }],
            },
          ],
        },
      ],
      payload: createPayloadFixture({ blocks: [] }),
      schemaBuildContext: context,
    })

    expect(builds.filter(({ label }) => label.startsWith('inline:'))).toHaveLength(2)
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

const createPayloadFixture = ({ blocks }: { blocks: Block[] }): Payload =>
  ({
    blocks: Object.fromEntries(blocks.map((block) => [block.slug, block])),
    config: {
      indexSortableFields: false,
      localization: {
        defaultLocale: 'en',
        fallback: true,
        localeCodes: ['en'],
        locales: [{ code: 'en', label: 'en' }],
      },
    },
    db: { useBigIntForNumberIDs: false },
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

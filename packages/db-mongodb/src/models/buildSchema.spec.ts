import type { Block, BlockSlug, Config, Field, Payload, SanitizedConfig } from 'payload'
import type { Schema } from 'mongoose'

import { sanitizeConfig } from 'payload'
import { createSchemaBuildContext } from 'payload/internal'
import { beforeAll, describe, expect, it, test } from 'vitest'

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

let payload: any

describe('buildSchema unique + localized defaultValue', () => {
  beforeAll(() => {
    const config: SanitizedConfig = sanitizeConfig({
      localization: {
        defaultLocale: 'en',
        fallback: true,
        locales: ['en', 'es'],
      },
    } as Config)

    payload = {
      collections: {},
      config,
      db: {},
    }
  })

  it('does not carry the static defaultValue on a unique localized relationship field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'uniqueLocalizedRelationship',
          type: 'relationship',
          defaultValue: '000000000000000000000001',
          localized: true,
          relationTo: 'some-collection',
          unique: true,
        },
      ],
      payload,
    })

    expect(schema.path('uniqueLocalizedRelationship.en').options.default).toBeUndefined()
    expect(schema.path('uniqueLocalizedRelationship.es').options.default).toBeUndefined()
  })

  it('does not carry the static defaultValue on a unique localized hasMany relationship field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'uniqueLocalizedHasManyRelationship',
          type: 'relationship',
          defaultValue: ['000000000000000000000001'],
          hasMany: true,
          localized: true,
          relationTo: 'some-collection',
          unique: true,
        },
      ],
      payload,
    })

    expect(schema.path('uniqueLocalizedHasManyRelationship.en').options.default).toBeUndefined()
    expect(schema.path('uniqueLocalizedHasManyRelationship.es').options.default).toBeUndefined()
  })

  it('does not carry the static defaultValue on a unique localized upload field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'uniqueLocalizedUpload',
          type: 'upload',
          defaultValue: '000000000000000000000001',
          localized: true,
          relationTo: 'some-upload-collection',
          unique: true,
        },
      ],
      payload,
    })

    expect(schema.path('uniqueLocalizedUpload.en').options.default).toBeUndefined()
    expect(schema.path('uniqueLocalizedUpload.es').options.default).toBeUndefined()
  })

  it('does not carry the static defaultValue on a unique localized hasMany select field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'uniqueLocalizedHasManySelect',
          type: 'select',
          defaultValue: ['a'],
          hasMany: true,
          localized: true,
          options: ['a', 'b'],
          unique: true,
        },
      ],
      payload,
    })

    expect(schema.path('uniqueLocalizedHasManySelect.en').options.type[0].default).toBeUndefined()
    expect(schema.path('uniqueLocalizedHasManySelect.es').options.type[0].default).toBeUndefined()
  })

  it('does not carry the static defaultValue on a unique localized point field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'uniqueLocalizedPoint',
          type: 'point',
          defaultValue: [0, 0],
          localized: true,
          unique: true,
        },
      ],
      payload,
    })

    expect(schema.path('uniqueLocalizedPoint.en.coordinates').options.default).toBeUndefined()
    expect(schema.path('uniqueLocalizedPoint.es.coordinates').options.default).toBeUndefined()
    // A leftover `type: 'Point'` without coordinates is invalid GeoJSON for the 2dsphere index
    expect(schema.path('uniqueLocalizedPoint.es.type').options.default).toBeUndefined()
  })

  it('still applies the static defaultValue on a non-unique localized point field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'localizedPoint',
          type: 'point',
          defaultValue: [0, 0],
          localized: true,
        },
      ],
      payload,
    })

    expect(schema.path('localizedPoint.en.coordinates').options.default).toEqual([0, 0])
  })

  it('still applies the static defaultValue on a non-unique localized relationship field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'localizedRelationship',
          type: 'relationship',
          defaultValue: '000000000000000000000001',
          localized: true,
          relationTo: 'some-collection',
        },
      ],
      payload,
    })

    expect(schema.path('localizedRelationship.en').options.default).toBe('000000000000000000000001')
  })
})

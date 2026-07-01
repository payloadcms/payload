import type { JSONSchema4 } from 'json-schema'
import { describe, it, expect } from 'vitest'

import type { Config } from '../config/types.js'

import { sanitizeConfig } from '../config/sanitize.js'
import { configToJSONSchema, entityToStandaloneJSONSchema } from './configToJSONSchema.js'
import type { Block, BlocksField, RichTextField } from '../fields/config/types.js'

describe('configToJSONSchema', () => {
  it('should handle optional arrays with required fields', async () => {
    // @ts-expect-error
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'someRequiredField',
              type: 'array',
              fields: [
                {
                  name: 'someRequiredField',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const { jsonSchema: schema } = configToJSONSchema(sanitizedConfig, 'text')

    expect(schema?.$defs?.test).toStrictEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        someRequiredField: {
          type: ['array', 'null'],
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: {
                type: ['string', 'null'],
              },
              someRequiredField: {
                type: 'string',
              },
            },
            required: ['someRequiredField'],
          },
        },
      },
      required: ['id'],
      title: 'Test',
    })
  })

  it('should generate separate input types when generateInputTypes is enabled', async () => {
    // @ts-expect-error partial config
    const config: Config = {
      collections: [
        { slug: 'authors', fields: [{ name: 'name', type: 'text' }] },
        { slug: 'categories', fields: [{ name: 'title', type: 'text' }] },
        {
          slug: 'posts',
          fields: [
            { name: 'title', type: 'text', required: true },
            {
              name: 'status',
              type: 'select',
              defaultValue: 'draft',
              options: ['draft', 'published'],
              required: true,
            },
            { name: 'author', type: 'relationship', relationTo: 'authors' },
            { name: 'categories', type: 'relationship', hasMany: true, relationTo: 'categories' },
          ],
        },
      ],
      typescript: { generateInputTypes: true },
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const { jsonSchema: schema } = configToJSONSchema(sanitizedConfig, 'text')

    // Output (read) shape is unchanged: relationships may be populated, managed fields are present,
    // and a required field with a defaultValue stays required.
    const postsOutput = schema?.$defs?.posts as JSONSchema4
    expect(postsOutput.title).toBe('Post')
    expect(postsOutput.properties!.author).toStrictEqual({
      oneOf: [{ type: ['string', 'null'] }, { $ref: '#/$defs/authors' }],
    })
    expect(postsOutput.properties!.categories).toStrictEqual({
      type: ['array', 'null'],
      items: { oneOf: [{ type: 'string' }, { $ref: '#/$defs/categories' }] },
    })
    expect(postsOutput.required).toStrictEqual(['id', 'title', 'status', 'updatedAt', 'createdAt'])

    // Input (write) shape: relationships are ID-only, the defaultValue field is optional, `id` is
    // optional, and createdAt/updatedAt are dropped. `id` and the defaulted `status` are optional
    // but NOT nullable - nullability follows the read shape, where they're non-null.
    expect(schema?.$defs?.posts_input).toStrictEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'published'] },
        author: { type: ['string', 'null'] },
        categories: { type: ['array', 'null'], items: { type: 'string' } },
      },
      required: ['title'],
      title: 'PostInput',
    })

    // The Config type exposes input shapes under `collectionsInput`.
    expect((schema?.properties?.collectionsInput as JSONSchema4)?.properties?.posts).toStrictEqual({
      $ref: '#/$defs/posts_input',
    })
  })

  it('should skip input types by default and generate them when enabled', async () => {
    // @ts-expect-error partial config
    const offByDefault: Config = {
      collections: [{ slug: 'posts', fields: [{ name: 'title', type: 'text' }] }],
    }
    const { jsonSchema: defaultSchema } = configToJSONSchema(
      await sanitizeConfig(offByDefault),
      'text',
    )
    expect(defaultSchema?.$defs?.posts_input).toBeUndefined()
    expect(defaultSchema?.properties?.collectionsInput).toBeUndefined()

    // @ts-expect-error partial config
    const enabled: Config = {
      collections: [{ slug: 'posts', fields: [{ name: 'title', type: 'text' }] }],
      typescript: { generateInputTypes: true },
    }
    const { jsonSchema: enabledSchema } = configToJSONSchema(
      await sanitizeConfig(enabled),
      'text',
    )
    expect(enabledSchema?.$defs?.posts_input).toBeDefined()
    expect(enabledSchema?.properties?.collectionsInput).toBeDefined()
  })

  it('should generate Input-suffixed definitions for named interfaces and blocks', async () => {
    // @ts-expect-error partial config
    const config: Config = {
      collections: [
        { slug: 'authors', fields: [{ name: 'name', type: 'text' }] },
        {
          slug: 'pages',
          fields: [
            {
              name: 'meta',
              type: 'group',
              interfaceName: 'Meta',
              fields: [{ name: 'author', type: 'relationship', relationTo: 'authors' }],
            },
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                {
                  slug: 'hero',
                  fields: [
                    { name: 'heading', type: 'text', required: true },
                    { name: 'cta', type: 'relationship', relationTo: 'authors' },
                  ],
                },
              ],
            },
          ],
        },
      ],
      typescript: { generateInputTypes: true },
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const { jsonSchema: schema } = configToJSONSchema(sanitizedConfig, 'text')

    // Read-shaped named interface keeps the populated-doc union...
    expect((schema?.$defs?.Meta as JSONSchema4).properties!.author).toStrictEqual({
      oneOf: [{ type: ['string', 'null'] }, { $ref: '#/$defs/authors' }],
    })
    // ...and a separate `Input` definition is ID-only, so the two don't collide.
    expect((schema?.$defs?.MetaInput as JSONSchema4).properties!.author).toStrictEqual({
      type: ['string', 'null'],
    })

    // Blocks get the same treatment: read-shaped `Hero`, write-shaped `HeroInput`.
    const heroInput = schema?.$defs?.HeroInput as JSONSchema4
    expect(heroInput.properties!.cta).toStrictEqual({ type: ['string', 'null'] })
    expect(heroInput.required).toStrictEqual(['blockType', 'heading'])
    expect((schema?.$defs?.Hero as JSONSchema4).properties!.cta).toStrictEqual({
      oneOf: [{ type: ['string', 'null'] }, { $ref: '#/$defs/authors' }],
    })
  })

  it('passes the variant to field-level jsonSchema transforms', async () => {
    // @ts-expect-error partial config
    const config: Config = {
      collections: [
        {
          slug: 'posts',
          fields: [
            {
              name: 'custom',
              type: 'text',
              jsonSchema: [({ jsonSchema, variant }) => ({ ...jsonSchema, description: variant })],
            },
          ],
        },
      ],
      typescript: { generateInputTypes: true },
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const { jsonSchema: schema } = configToJSONSchema(sanitizedConfig, 'text')

    expect((schema?.$defs?.posts as JSONSchema4).properties!.custom.description).toBe('output')
    expect((schema?.$defs?.posts_input as JSONSchema4).properties!.custom.description).toBe('input')
  })

  it('should handle block fields with no blocks', async () => {
    // @ts-expect-error
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'blockField',
              type: 'blocks',
              blocks: [],
            },
            {
              name: 'blockFieldRequired',
              type: 'blocks',
              blocks: [],
              required: true,
            },
            {
              name: 'blockFieldWithFields',
              type: 'blocks',
              blocks: [
                {
                  slug: 'test',
                  fields: [
                    {
                      name: 'field',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
            {
              name: 'blockFieldWithFieldsRequired',
              type: 'blocks',
              blocks: [
                {
                  slug: 'testRequired',
                  fields: [
                    {
                      name: 'field',
                      type: 'text',
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const { jsonSchema: schema } = configToJSONSchema(sanitizedConfig, 'text')

    expect(schema?.$defs?.test).toStrictEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        blockField: {
          type: ['array', 'null'],
          items: {},
        },
        blockFieldRequired: {
          type: 'array',
          items: {},
        },
        blockFieldWithFields: {
          type: ['array', 'null'],
          items: {
            oneOf: [{ $ref: '#/$defs/Test' }],
          },
        },
        blockFieldWithFieldsRequired: {
          type: ['array', 'null'],
          items: {
            oneOf: [{ $ref: '#/$defs/TestRequired' }],
          },
        },
      },
      required: ['id', 'blockFieldRequired'],
      title: 'Test',
    })
  })

  it('keeps the first block interface name clean and content-hashes the colliding one', async () => {
    // @ts-expect-error - partial config for testing
    const config: Config = {
      collections: [
        {
          slug: 'pages',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                { slug: 'hero', fields: [{ name: 'title', type: 'text' }] },
                { slug: 'cta', fields: [{ name: 'label', type: 'text' }] },
              ],
            },
          ],
          timestamps: false,
          versions: false,
        },
        {
          slug: 'posts',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              // Same slug `hero`, DIFFERENT fields → name collision with pages' hero.
              blocks: [{ slug: 'hero', fields: [{ name: 'heading', type: 'text' }] }],
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const { jsonSchema: schema } = configToJSONSchema(sanitizedConfig, 'text')
    const defs = schema.$defs!

    // The first `hero` keeps the clean name; the unique block is unaffected.
    expect(defs.Hero).toBeDefined()
    expect(defs.Cta).toBeDefined()

    // Only the second, differently-shaped `hero` is disambiguated with a content hash.
    const hashedHeroNames = Object.keys(defs).filter((k) => /^Hero_[0-9A-F]{8}$/.test(k))
    expect(hashedHeroNames).toHaveLength(1)

    // The disambiguated interface carries the explanatory JSDoc note; the clean one does not.
    expect((defs[hashedHeroNames[0]!] as { description?: string }).description).toContain(
      'content hash',
    )
    expect((defs.Hero as { description?: string }).description).toBeUndefined()

    // Each collection's block field references its own block's interface.
    const refsOf = (slug: string): string[] =>
      (
        defs[slug] as { properties: { layout: { items: { oneOf: Array<{ $ref: string }> } } } }
      ).properties.layout.items.oneOf.map((r) => r.$ref)
    expect(refsOf('pages')).toContain('#/$defs/Hero')
    expect(refsOf('pages')).toContain('#/$defs/Cta')
    expect(refsOf('posts')).toStrictEqual([`#/$defs/${hashedHeroNames[0]}`])

    // Hashing is deterministic: regenerating yields identical names.
    const { jsonSchema: schema2 } = configToJSONSchema(sanitizedConfig, 'text')
    expect(
      Object.keys(schema2.$defs!)
        .filter((k) => /^Hero/.test(k))
        .sort(),
    ).toStrictEqual(
      Object.keys(defs)
        .filter((k) => /^Hero/.test(k))
        .sort(),
    )
  })

  it('should handle tabs and named tabs with required fields', async () => {
    // @ts-expect-error
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  fields: [
                    {
                      name: 'fieldInUnnamedTab',
                      type: 'text',
                    },
                  ],
                  label: 'unnamedTab',
                },
                {
                  name: 'namedTab',
                  fields: [
                    {
                      name: 'fieldInNamedTab',
                      type: 'text',
                    },
                  ],
                  label: 'namedTab',
                },
                {
                  name: 'namedTabWithRequired',
                  fields: [
                    {
                      name: 'fieldInNamedTab',
                      type: 'text',
                      required: true,
                    },
                  ],
                  label: 'namedTabWithRequired',
                },
              ],
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const { jsonSchema: schema } = configToJSONSchema(sanitizedConfig, 'text')

    expect(schema?.$defs?.test).toStrictEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        fieldInUnnamedTab: {
          type: ['string', 'null'],
        },
        namedTab: {
          type: 'object',
          additionalProperties: false,
          properties: {
            fieldInNamedTab: {
              type: ['string', 'null'],
            },
          },
          required: [],
        },
        namedTabWithRequired: {
          type: 'object',
          additionalProperties: false,
          properties: {
            fieldInNamedTab: {
              type: 'string',
            },
          },
          required: ['fieldInNamedTab'],
        },
      },
      required: ['id', 'namedTabWithRequired'],
      title: 'Test',
    })
  })

  it('should handle custom typescript schema and JSON field schema', async () => {
    const customSchema: JSONSchema4 = {
      type: 'object',
      properties: {
        id: {
          type: 'number',
        },
        required: ['id'],
      },
    }

    const config: Partial<Config> = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'withCustom',
              type: 'text',
              jsonSchema: [() => customSchema],
            },
            {
              name: 'jsonWithSchema',
              type: 'json',
              jsonSchema: {
                fileMatch: ['a://b/foo.json'],
                schema: customSchema,
                uri: 'a://b/foo.json',
              },
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config as Config)
    const { jsonSchema: schema } = configToJSONSchema(sanitizedConfig, 'text')

    expect(schema?.$defs?.test).toStrictEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        jsonWithSchema: customSchema,
        withCustom: customSchema,
      },
      required: ['id'],
      title: 'Test',
    })
  })

  it('should handle same block object being referenced in both collection and config.blocks', async () => {
    const sharedBlock: Block = {
      slug: 'sharedBlock',
      interfaceName: 'SharedBlock',
      fields: [
        {
          name: 'richText',
          type: 'richText',
          editor: () => {
            // stub rich text editor
            return {
              CellComponent: '',
              FieldComponent: '',
              validate: () => true,
            }
          },
        },
      ],
    }

    // @ts-expect-error
    const config: Config = {
      blocks: [sharedBlock],
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'someBlockField',
              type: 'blocks',
              blocks: [sharedBlock],
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    }

    // Ensure both rich text editor are sanitized
    const sanitizedConfig = await sanitizeConfig(config)
    expect(typeof (sanitizedConfig?.blocks?.[0]?.fields?.[0] as RichTextField)?.editor).toBe(
      'object',
    )
    expect(
      typeof (
        (sanitizedConfig.collections[0].fields[0] as BlocksField)?.blocks?.[0]
          ?.fields?.[0] as RichTextField
      )?.editor,
    ).toBe('object')

    const { jsonSchema: schema } = configToJSONSchema(sanitizedConfig, 'text')

    const expectedBlockSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: ['string', 'null'] },
        blockName: { type: ['string', 'null'] },
        blockType: { const: 'sharedBlock' },
        richText: { type: ['array', 'null'], items: { type: 'object' } },
      },
      required: ['blockType'],
    }

    expect(schema?.$defs?.test).toStrictEqual({
      type: 'object',
      additionalProperties: false,
      title: 'Test',
      properties: {
        id: {
          type: 'string',
        },
        someBlockField: {
          type: ['array', 'null'],
          items: {
            oneOf: [
              {
                $ref: '#/$defs/SharedBlock',
              },
            ],
          },
        },
      },
      required: ['id'],
    })

    // The definition should still be registered for TypeScript type generation
    expect(schema?.$defs?.SharedBlock).toStrictEqual(expectedBlockSchema)
  })

  it('content-hashes a colliding explicit interfaceName instead of overwriting it', async () => {
    // Two different blocks both set `interfaceName: 'Hero'` - each must keep its own definition.
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'blocksField',
              type: 'blocks',
              blocks: [
                {
                  slug: 'blockA',
                  fields: [{ name: 'title', type: 'text' }],
                  interfaceName: 'Hero',
                },
                {
                  slug: 'blockB',
                  fields: [{ name: 'subtitle', type: 'number' }],
                  interfaceName: 'Hero',
                },
              ],
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    } as unknown as Config

    const sanitizedConfig = await sanitizeConfig(config)
    const { jsonSchema } = configToJSONSchema(sanitizedConfig, 'text')
    const defs = jsonSchema.$defs!

    // Each differently-shaped block keeps its own interface (one clean, one hash-suffixed).
    const heroNames = Object.keys(defs).filter((k) => /^Hero(_[0-9A-F]{8})?$/.test(k))
    expect(heroNames).toHaveLength(2)

    // ...and they carry distinct field shapes (not a silent overwrite).
    const shapeOf = (name: string): string =>
      Object.keys((defs[name] as { properties: Record<string, unknown> }).properties)
        .sort()
        .join(',')
    expect(shapeOf(heroNames[0]!)).not.toBe(shapeOf(heroNames[1]!))
  })

  it('reuses one definition when the same block is registered more than once', async () => {
    // Reusing one block across fields registers an identical schema each time, so it dedupes.
    const heroBlock = {
      slug: 'hero',
      fields: [{ name: 'title', type: 'text' }],
      interfaceName: 'Hero',
    }
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            { name: 'a', type: 'blocks', blocks: [heroBlock] },
            { name: 'b', type: 'blocks', blocks: [heroBlock] },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    } as unknown as Config

    const sanitizedConfig = await sanitizeConfig(config)
    const { jsonSchema } = configToJSONSchema(sanitizedConfig, 'text')

    const heroNames = Object.keys(jsonSchema.$defs!).filter((k) => /^Hero(_[0-9A-F]{8})?$/.test(k))
    expect(heroNames).toEqual(['Hero'])
  })

  it('should allow overriding required to false', async () => {
    // @ts-expect-error
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              defaultValue: 'test',
              jsonSchema: [
                () => ({
                  type: 'string',
                  required: false,
                }),
              ],
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const { jsonSchema: schema } = configToJSONSchema(sanitizedConfig, 'text')

    // @ts-expect-error
    expect(schema.$defs.test.properties.title.required).toStrictEqual(false)
  })

  it('should propagate forceInlineBlocks to nested fields (array, group, tab)', async () => {
    const namedBlock: Block = {
      slug: 'myBlock',
      interfaceName: 'MyBlock',
      fields: [{ name: 'text', type: 'text' }],
    }

    // @ts-expect-error
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'arr',
              type: 'array',
              fields: [{ name: 'blocks', type: 'blocks', blocks: [namedBlock] }],
            },
            {
              name: 'grp',
              type: 'group',
              fields: [{ name: 'blocks', type: 'blocks', blocks: [namedBlock] }],
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)

    // Without forceInlineBlocks: blocks field uses $ref
    const { jsonSchema: schemaDefault } = configToJSONSchema(sanitizedConfig, 'text')
    const arrItemsDefault = schemaDefault.$defs!.test.properties!.arr.items as JSONSchema4
    const arrBlocksDefault = (arrItemsDefault.properties!.blocks.items as JSONSchema4).oneOf![0]
    expect(arrBlocksDefault).toStrictEqual({ $ref: '#/$defs/MyBlock' })

    // With forceInlineBlocks: blocks field is inlined, no $ref
    const { jsonSchema: schemaInline } = configToJSONSchema(sanitizedConfig, 'text', undefined, {
      forceInlineBlocks: true,
    })
    const arrItemsInline = schemaInline.$defs!.test.properties!.arr.items as JSONSchema4
    const arrBlocksInline = (arrItemsInline.properties!.blocks.items as JSONSchema4).oneOf![0]
    expect(arrBlocksInline).not.toHaveProperty('$ref')
    expect(arrBlocksInline.properties?.blockType).toStrictEqual({ const: 'myBlock' })

    const grpBlocksInline = (
      schemaInline.$defs!.test.properties!.grp.properties!.blocks.items as JSONSchema4
    ).oneOf![0]
    expect(grpBlocksInline).not.toHaveProperty('$ref')
    expect(grpBlocksInline.properties?.blockType).toStrictEqual({ const: 'myBlock' })
  })

  it('entityToStandaloneJSONSchema bundles only the definitions an entity references', async () => {
    const sharedBlock: Block = {
      slug: 'sharedBlock',
      interfaceName: 'SharedBlock',
      fields: [{ name: 'title', type: 'text' }],
    }

    // @ts-expect-error partial config
    const config: Config = {
      admin: {
        timezones: {
          supportedTimezones: [
            { label: 'UTC', value: 'UTC' },
            { label: 'New York', value: 'America/New_York' },
          ],
        },
      },
      blocks: [sharedBlock],
      collections: [
        {
          slug: 'with-refs',
          fields: [
            { name: 'layout', type: 'blocks', blocks: ['sharedBlock'] },
            { name: 'when', type: 'date', timezone: true },
          ],
          timestamps: false,
          versions: false,
        },
        {
          slug: 'other',
          fields: [{ name: 'title', type: 'text' }],
          timestamps: false,
          versions: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const entity = sanitizedConfig.collections.find(
      (collection) => collection.slug === 'with-refs',
    )!

    const schema = entityToStandaloneJSONSchema({
      config: sanitizedConfig,
      defaultIDType: 'text',
      entity,
    })

    // Has its own $schema, so it resolves on its own.
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')

    // The block reference is resolved inline, so it can't dangle.
    const layoutItems = (schema.properties?.layout as JSONSchema4)?.items as JSONSchema4
    const inlinedBlock = (layoutItems?.oneOf?.[0] ?? {}) as JSONSchema4
    expect(inlinedBlock.properties?.blockType).toStrictEqual({ const: 'sharedBlock' })
    expect(inlinedBlock.properties?.title).toBeDefined()

    // A timezone field pulls in supportedTimezones from the root config.
    expect(schema.$defs?.supportedTimezones).toBeDefined()

    // Doesn't pull in unrelated collections.
    expect(schema.$defs?.other).toBeUndefined()
  })
})

import type { JSONSchema4 } from 'json-schema'
import { describe, it, expect } from 'vitest'

import type { Config } from '../config/types.js'

import { sanitizeConfig } from '../config/sanitize.js'
import { configToJSONSchema } from './configToJSONSchema.js'
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
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const schema = configToJSONSchema(sanitizedConfig, 'text')

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
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const schema = configToJSONSchema(sanitizedConfig, 'text')

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
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const schema = configToJSONSchema(sanitizedConfig, 'text')
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
    const schema2 = configToJSONSchema(sanitizedConfig, 'text')
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
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const schema = configToJSONSchema(sanitizedConfig, 'text')

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
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config as Config)
    const schema = configToJSONSchema(sanitizedConfig, 'text')

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

    const schema = configToJSONSchema(sanitizedConfig, 'text')

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
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const schema = configToJSONSchema(sanitizedConfig, 'text')

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
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)

    // Without forceInlineBlocks: blocks field uses $ref
    const schemaDefault = configToJSONSchema(sanitizedConfig, 'text')
    const arrItemsDefault = schemaDefault.$defs!.test.properties!.arr.items as JSONSchema4
    const arrBlocksDefault = (arrItemsDefault.properties!.blocks.items as JSONSchema4).oneOf![0]
    expect(arrBlocksDefault).toStrictEqual({ $ref: '#/$defs/MyBlock' })

    // With forceInlineBlocks: blocks field is inlined, no $ref
    const schemaInline = configToJSONSchema(sanitizedConfig, 'text', undefined, {
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
})

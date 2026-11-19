import type { Block, CollectionConfig, Config, SanitizedConfig } from 'payload'
import { sanitizeConfig } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { setColumnID } from '../postgres/schema/setColumnID.js'
import type { DrizzleAdapter } from '../types.js'
import { checkTruncatedIdentifiers } from '../utilities/checkTruncatedIdentifiers.js'
import { hasCompanionRelation } from '../utilities/hasCompanionRelation.js'
import { warnRenamedSubTables } from '../utilities/warnRenamedSubTables.js'
import { buildRawSchema } from './buildRawSchema.js'

const headlineBlock: Block = {
  slug: 'headline',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}

const createContainerBlock = (slug: string): Block => ({
  slug,
  fields: [
    {
      name: 'content',
      type: 'blocks',
      blockReferences: ['headline'],
      blocks: [],
    },
  ],
})

const createAdapter = (
  config: SanitizedConfig,
  warn: (...args: any[]) => void = () => {},
  name: 'postgres' | 'sqlite' = 'postgres',
): DrizzleAdapter =>
  ({
    name,
    blocksAsJSON: false,
    fieldConstraints: {},
    idType: 'serial',
    localesSuffix: '_locales',
    payload: {
      blocks: Object.fromEntries(config.blocks.map((block) => [block.slug, block])),
      collections: Object.fromEntries(
        config.collections.map((collection) => [
          collection.slug,
          {
            config: collection,
            customIDType: undefined,
          },
        ]),
      ),
      config,
      logger: { warn },
    },
    rawRelations: {},
    rawTables: {},
    relationshipsSuffix: '_rels',
    tableNameMap: new Map(),
    versionsSuffix: '_versions',
  }) as unknown as DrizzleAdapter

describe('buildRawSchema', () => {
  it('should not create duplicate suffixed block tables for identical reused blocks under localized ancestors', async () => {
    const layoutBlocks = [createContainerBlock('container'), createContainerBlock('container50')]

    const config = await sanitizeConfig({
      blocks: [headlineBlock],
      collections: [
        {
          slug: 'pages',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              localized: true,
              blocks: layoutBlocks,
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
              localized: true,
              blocks: layoutBlocks,
            },
          ],
          timestamps: false,
        },
      ],
      localization: {
        defaultLocale: 'en',
        locales: ['en', 'de'],
      },
    } as Config)

    const adapter = createAdapter(config)

    buildRawSchema({
      adapter,
      setColumnID,
    })

    expect(adapter.rawTables.pages_blocks_headline).toBeDefined()
    expect(adapter.rawTables.pages_blocks_headline.columns._locale).toBeDefined()
    expect(adapter.rawTables.pages_blocks_headline_2).toBeUndefined()
    expect(adapter.rawTables.pages_blocks_headline_2_locales).toBeUndefined()
    expect(adapter.rawTables.posts_blocks_headline).toBeDefined()
    expect(adapter.rawTables.posts_blocks_headline.columns._locale).toBeDefined()
    expect(adapter.rawTables.posts_blocks_headline_2).toBeUndefined()
    expect(adapter.rawTables.posts_blocks_headline_2_locales).toBeUndefined()
  })

  it('should warn when a localized field pushes the _locales companion table past 63 chars', async () => {
    // Base table name (61 chars) is under the limit, but `${base}_locales` (69) overflows it.
    const longSlug = `localized_collection_${'x'.repeat(40)}`

    const config = await sanitizeConfig({
      collections: [
        {
          slug: longSlug,
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
            },
          ],
          timestamps: false,
        },
      ],
      localization: {
        defaultLocale: 'en',
        locales: ['en', 'de'],
      },
    } as Config)

    const warn = vi.fn()
    const adapter = createAdapter(config, warn)

    buildRawSchema({ adapter, setColumnID })

    expect(adapter.rawTables[`${longSlug}_locales`]).toBeDefined()

    expect(() => checkTruncatedIdentifiers({ adapter, logWarnings: true })).not.toThrow()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain(`${longSlug}_locales`)
  })

  it('should not warn when the _locales companion table fits within 63 chars', async () => {
    const config = await sanitizeConfig({
      collections: [
        {
          slug: 'short_localized',
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
            },
          ],
          timestamps: false,
        },
      ],
      localization: {
        defaultLocale: 'en',
        locales: ['en', 'de'],
      },
    } as Config)

    const warn = vi.fn()
    const adapter = createAdapter(config, warn)

    buildRawSchema({ adapter, setColumnID })

    expect(adapter.rawTables.short_localized_locales).toBeDefined()

    checkTruncatedIdentifiers({ adapter, logWarnings: true })

    expect(warn).not.toHaveBeenCalled()
  })

  it('should keep array sub-table index and foreign key names within 63 chars', async () => {
    const arrayFieldName = 'a'.repeat(58)

    const config = await sanitizeConfig({
      collections: [
        {
          slug: 'p',
          fields: [
            {
              name: arrayFieldName,
              type: 'array',
              fields: [{ name: 'title', type: 'text' }],
            },
          ],
          timestamps: false,
        },
      ],
    } as Config)

    const warn = vi.fn()
    const adapter = createAdapter(config, warn)

    buildRawSchema({ adapter, setColumnID })

    const arrayTable = adapter.rawTables[`p_${arrayFieldName}`]

    expect(arrayTable).toBeDefined()

    const names = [
      arrayTable.indexes._orderIdx.name,
      arrayTable.indexes._parentIDIdx.name,
      arrayTable.foreignKeys._parentIDFk.name,
    ]

    for (const name of names) {
      expect(name.length).toBeLessThanOrEqual(63)
      expect(name).toMatch(/_[\da-f]{8}_(idx|fk)$/)
    }

    expect(new Set(names).size).toBe(names.length)

    checkTruncatedIdentifiers({ adapter, logWarnings: true })

    expect(warn).not.toHaveBeenCalled()
  })

  it('should move a relationship foreign key past 63 chars to a named table-level foreign key', async () => {
    const groupName = 'g'.repeat(40)

    const config = await sanitizeConfig({
      collections: [
        {
          slug: 'p',
          fields: [
            {
              name: groupName,
              type: 'group',
              fields: [{ name: 'author', type: 'relationship', relationTo: 'authors' }],
            },
          ],
          timestamps: false,
          versions: false,
        },
        {
          slug: 'authors',
          fields: [],
          timestamps: false,
          versions: false,
        },
      ],
    } as Config)

    const adapter = createAdapter(config)

    buildRawSchema({ adapter, setColumnID })

    const table = adapter.rawTables.p
    const columnKey = `${groupName}_author`

    expect(table.columns[columnKey].reference).toBeUndefined()

    const foreignKey = table.foreignKeys?.[`${columnKey}Fk`]

    expect(foreignKey).toBeDefined()
    expect(foreignKey?.name.length).toBeLessThanOrEqual(63)
    expect(foreignKey?.name.endsWith('_fk')).toBe(true)
    expect(foreignKey?.columns).toEqual([columnKey])
    expect(foreignKey?.foreignColumns).toEqual([{ name: 'id', table: 'authors' }])
    expect(foreignKey?.onDelete).toBe('set null')
  })

  it('should keep the inline reference for a relationship foreign key within 63 chars', async () => {
    const config = await sanitizeConfig({
      collections: [
        {
          slug: 'posts',
          fields: [{ name: 'author', type: 'relationship', relationTo: 'authors' }],
          timestamps: false,
          versions: false,
        },
        {
          slug: 'authors',
          fields: [],
          timestamps: false,
          versions: false,
        },
      ],
    } as Config)

    const adapter = createAdapter(config)

    buildRawSchema({ adapter, setColumnID })

    const table = adapter.rawTables.posts

    expect(table.columns.author.reference).toEqual({
      name: 'id',
      onDelete: 'set null',
      table: 'authors',
    })
    expect(table.foreignKeys?.authorFk).toBeUndefined()
  })

  it('should keep sub-table index and foreign key names of up to 63 chars unchanged', async () => {
    // `p_` + 48 chars + `_parent_id_idx` is 64 chars, `_parent_id_fk` 63 and `_order_idx` 60.
    // Only the index over 63 chars is renamed; names Postgres already stores in full stay as they are.
    const arrayFieldName = 'a'.repeat(48)

    const config = await sanitizeConfig({
      collections: [
        {
          slug: 'p',
          fields: [{ name: arrayFieldName, type: 'array', fields: [{ name: 't', type: 'text' }] }],
          timestamps: false,
          versions: false,
        },
      ],
    } as Config)

    const adapter = createAdapter(config)

    buildRawSchema({ adapter, setColumnID })

    const tableName = `p_${arrayFieldName}`
    const arrayTable = adapter.rawTables[tableName]

    expect(arrayTable.indexes._orderIdx.name).toBe(`${tableName}_order_idx`)
    expect(arrayTable.foreignKeys._parentIDFk.name).toBe(`${tableName}_parent_id_fk`)
    expect(arrayTable.indexes._parentIDIdx.name).not.toBe(`${tableName}_parent_id_idx`)
    expect(arrayTable.indexes._parentIDIdx.name).toHaveLength(63)
  })

  it('should not rename long sub-table identifiers on other tables when a sibling field is added', async () => {
    const prefix = 'x'.repeat(54)

    const buildArrayTable = async (fieldNames: string[]) => {
      const config = await sanitizeConfig({
        collections: [
          {
            slug: 'p',
            fields: fieldNames.map((name) => ({
              name,
              type: 'array' as const,
              fields: [{ name: 't', type: 'text' as const }],
            })),
            timestamps: false,
            versions: false,
          },
        ],
      } as Config)

      const adapter = createAdapter(config)

      buildRawSchema({ adapter, setColumnID })

      const table = adapter.rawTables[`p_${prefix}_beta`]

      return {
        foreignKeys: Object.values(table.foreignKeys).map(({ name }) => name),
        indexes: Object.values(table.indexes).map(({ name }) => name),
      }
    }

    const before = await buildArrayTable([`${prefix}_alpha`, `${prefix}_beta`])
    const after = await buildArrayTable([`${prefix}_aaa`, `${prefix}_alpha`, `${prefix}_beta`])

    expect(after).toEqual(before)
  })

  it('should not rename identifiers or move foreign keys on non-Postgres adapters', async () => {
    const arrayFieldName = 'a'.repeat(58)
    const groupName = 'g'.repeat(40)

    const config = await sanitizeConfig({
      collections: [
        {
          slug: 'p',
          fields: [
            { name: arrayFieldName, type: 'array', fields: [{ name: 't', type: 'text' }] },
            {
              name: groupName,
              type: 'group',
              fields: [{ name: 'author', type: 'relationship', relationTo: 'authors' }],
            },
          ],
          timestamps: false,
          versions: false,
        },
        { slug: 'authors', fields: [], timestamps: false, versions: false },
      ],
    } as Config)

    const adapter = createAdapter(config, undefined, 'sqlite')

    buildRawSchema({ adapter, setColumnID })

    const arrayTableName = `p_${arrayFieldName}`
    const arrayTable = adapter.rawTables[arrayTableName]

    expect(arrayTable.indexes._orderIdx.name).toBe(`${arrayTableName}_order_idx`)
    expect(arrayTable.indexes._parentIDIdx.name).toBe(`${arrayTableName}_parent_id_idx`)
    expect(arrayTable.foreignKeys._parentIDFk.name).toBe(`${arrayTableName}_parent_id_fk`)

    const columnKey = `${groupName}_author`

    expect(adapter.rawTables.p.columns[columnKey].reference).toEqual({
      name: 'id',
      onDelete: 'set null',
      table: 'authors',
    })
    expect(adapter.rawTables.p.foreignKeys?.[`${columnKey}Fk`]).toBeUndefined()
  })

  describe('sub-tables named like a companion table', () => {
    const buildCollection = async (fields: CollectionConfig['fields']) => {
      const config = await sanitizeConfig({
        collections: [
          { slug: 'p', fields, timestamps: false, versions: false },
          { slug: 'authors', fields: [], timestamps: false, versions: false },
        ],
      } as Config)

      const adapter = createAdapter(config)

      buildRawSchema({ adapter, setColumnID })

      return adapter
    }

    it('should rename an array table that shares its name with the relationships table', async () => {
      const adapter = await buildCollection([
        { name: 'rels', type: 'array', fields: [{ name: 'value', type: 'text' }] },
        { name: 'authors', type: 'relationship', hasMany: true, relationTo: 'authors' },
      ])

      expect(adapter.tableNameMap.get('p_rels')).toBe('p_rels_field')
      expect(adapter.rawTables.p_rels_field.columns.value).toBeDefined()
      expect(adapter.rawTables.p_rels.columns.authorsID).toBeDefined()
      expect(adapter.rawTables.p_rels.columns.value).toBeUndefined()
    })

    it('should rename array and select tables that share their names with the texts and numbers tables', async () => {
      const adapter = await buildCollection([
        { name: 'numbers', type: 'array', fields: [{ name: 'drawPosition', type: 'number' }] },
        { name: 'texts', type: 'select', hasMany: true, options: ['a', 'b'] },
        { name: 'scores', type: 'number', hasMany: true },
        { name: 'tags', type: 'text', hasMany: true },
      ])

      expect(adapter.tableNameMap.get('p_numbers')).toBe('p_numbers_field')
      expect(adapter.tableNameMap.get('p_texts')).toBe('p_texts_field')
      expect(adapter.rawTables.p_numbers_field.columns.drawPosition).toBeDefined()
      expect(adapter.rawTables.p_numbers.columns.number).toBeDefined()
      expect(adapter.rawTables.p_texts.columns.text).toBeDefined()
    })

    it('should pick an unused name when the suffixed name is taken by another field', async () => {
      const adapter = await buildCollection([
        { name: 'numbers', type: 'array', fields: [{ name: 'drawPosition', type: 'number' }] },
        { name: 'numbersField', type: 'array', fields: [{ name: 'label', type: 'text' }] },
        { name: 'scores', type: 'number', hasMany: true },
      ])

      expect(adapter.tableNameMap.get('p_numbers')).toBe('p_numbers_field_2')
      expect(adapter.tableNameMap.get('p_numbers_field')).toBe('p_numbers_field')
      expect(adapter.rawTables.p_numbers_field_2.columns.drawPosition).toBeDefined()
      expect(adapter.rawTables.p_numbers_field.columns.label).toBeDefined()
      expect(adapter.rawTables.p_numbers_field.columns.drawPosition).toBeUndefined()
      expect(adapter.rawTables.p_numbers.columns.number).toBeDefined()
    })

    it('should not rename into a name used as a prefix by nested tables', async () => {
      // Only `p_numbers_field_items` exists, not `p_numbers_field`. Renaming `p_numbers` to
      // `p_numbers_field` would turn its nested `items` table into `p_numbers_field_items` too.
      const adapter = await buildCollection([
        {
          name: 'numbers',
          type: 'array',
          fields: [
            { name: 'items', type: 'array', fields: [{ name: 'position', type: 'number' }] },
          ],
        },
        {
          name: 'numbersFieldItems',
          type: 'array',
          fields: [{ name: 'label', type: 'text' }],
        },
        { name: 'scores', type: 'number', hasMany: true },
      ])

      expect(adapter.tableNameMap.get('p_numbers')).toBe('p_numbers_field_2')
      expect(adapter.rawTables.p_numbers_field_2_items.columns.position).toBeDefined()
      expect(adapter.rawTables.p_numbers_field_items.columns.label).toBeDefined()
      expect(adapter.rawTables.p_numbers_field_items.columns.position).toBeUndefined()
    })

    it('should rename a nested table that clashes only after its parent was renamed', async () => {
      // `p_numbers` is renamed to `p_numbers_field` because of the `scores` numbers table. Its
      // nested `locales` array then becomes `p_numbers_field_locales`, the name of the renamed
      // array's own locales table.
      const config = await sanitizeConfig({
        collections: [
          {
            slug: 'p',
            fields: [
              {
                name: 'numbers',
                type: 'array',
                fields: [
                  { name: 'title', type: 'text', localized: true },
                  { name: 'locales', type: 'array', fields: [{ name: 'code', type: 'text' }] },
                ],
              },
              { name: 'scores', type: 'number', hasMany: true },
            ],
            timestamps: false,
            versions: false,
          },
        ],
        localization: { defaultLocale: 'en', locales: ['en', 'de'] },
      } as Config)

      const adapter = createAdapter(config)

      buildRawSchema({ adapter, setColumnID })

      const numbersTableName = adapter.tableNameMap.get('p_numbers')!
      const nestedLocalesTableName = adapter.tableNameMap.get(`${numbersTableName}_locales`)!

      expect(numbersTableName).toBe('p_numbers_field')
      expect(nestedLocalesTableName).not.toBe('p_numbers_field_locales')
      expect(adapter.rawTables[nestedLocalesTableName].columns.code).toBeDefined()
      expect(adapter.rawTables.p_numbers_field_locales.columns.title).toBeDefined()
      expect(adapter.rawTables.p_numbers_field_locales.columns.code).toBeUndefined()
    })

    it('should keep the table name when there is no companion table with that name', async () => {
      // No `hasMany` number or text fields, so there are no `p_numbers` or `p_texts` companion tables.
      const adapter = await buildCollection([
        { name: 'numbers', type: 'array', fields: [{ name: 'drawPosition', type: 'number' }] },
        { name: 'texts', type: 'array', fields: [{ name: 'value', type: 'text' }] },
      ])

      expect(adapter.tableNameMap.get('p_numbers')).toBe('p_numbers')
      expect(adapter.tableNameMap.get('p_texts')).toBe('p_texts')
      expect(adapter.rawTables.p_numbers.columns.drawPosition).toBeDefined()
      expect(adapter.rawTables.p_texts.columns.value).toBeDefined()
      expect(adapter.rawTables.p_numbers_field).toBeUndefined()
    })

    it('should rename an array table that takes the name of a companion table built before it', async () => {
      const config = await sanitizeConfig({
        collections: [
          {
            slug: 'p',
            fields: [
              {
                name: 'items',
                type: 'array',
                fields: [{ name: 'title', type: 'text', localized: true }],
              },
              { name: 'itemsLocales', type: 'array', fields: [{ name: 'label', type: 'text' }] },
            ],
            timestamps: false,
            versions: false,
          },
        ],
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
      } as Config)
      const adapter = createAdapter(config)

      buildRawSchema({ adapter, setColumnID })

      expect(adapter.tableNameMap.get('p_items_locales')).toBe('p_items_locales_field')
      expect(adapter.rawTables.p_items_locales.columns.title).toBeDefined()
      expect(adapter.rawTables.p_items_locales.columns.label).toBeUndefined()
      expect(adapter.rawTables.p_items_locales_field.columns.label).toBeDefined()
    })

    it('should rename an array table that takes the dbName of a collection built after it', async () => {
      const config = await sanitizeConfig({
        collections: [
          {
            slug: 'p',
            fields: [{ name: 'items', type: 'array', fields: [{ name: 'label', type: 'text' }] }],
            timestamps: false,
            versions: false,
          },
          {
            slug: 'q',
            dbName: 'p_items',
            fields: [{ name: 'title', type: 'text' }],
            timestamps: false,
            versions: false,
          },
        ],
      } as Config)
      const adapter = createAdapter(config)

      buildRawSchema({ adapter, setColumnID })

      expect(adapter.tableNameMap.get('p_items')).toBe('p_items_field')
      expect(adapter.rawTables.p_items.columns.title).toBeDefined()
      expect(adapter.rawTables.p_items_field.columns.label).toBeDefined()
    })

    it('should keep the replacement name within the identifier length limit', async () => {
      const slug = 'a'.repeat(51)
      const config = await sanitizeConfig({
        collections: [
          {
            slug,
            fields: [
              {
                name: 'numbers',
                type: 'array',
                fields: [{ name: 'drawPosition', type: 'number' }],
              },
              { name: 'scores', type: 'number', hasMany: true },
            ],
            timestamps: false,
            versions: false,
          },
        ],
      } as Config)
      const adapter = createAdapter(config)

      buildRawSchema({ adapter, setColumnID })

      const replacement = adapter.tableNameMap.get(`${slug}_numbers`)

      expect(replacement).toHaveLength(63)
      expect(replacement?.endsWith('_field')).toBe(true)
      expect(adapter.rawTables[replacement!].columns.drawPosition).toBeDefined()
    })

    it('should not rename a table to the name of an enum', async () => {
      const adapter = await buildCollection([
        { name: 'numbers', type: 'array', fields: [{ name: 'drawPosition', type: 'number' }] },
        { name: 'scores', type: 'number', hasMany: true },
        { name: 'status', type: 'select', enumName: 'p_numbers_field', options: ['a', 'b'] },
      ])

      expect(adapter.tableNameMap.get('p_numbers')).toBe('p_numbers_field_2')
      expect(adapter.rawTables.p_numbers_field).toBeUndefined()
    })

    it('should not give a hasMany select enum the dbName of its table', async () => {
      const adapter = await buildCollection([
        { name: 'tags', type: 'select', dbName: 'p_tags_custom', hasMany: true, options: ['a'] },
      ])

      expect(adapter.rawTables.p_tags_custom.columns.value).toMatchObject({
        enumName: 'enum_p_tags_custom',
      })
    })

    it('should not give a renamed hasMany select table and its enum the same name', async () => {
      const adapter = await buildCollection([
        { name: 'values', type: 'select', dbName: 'p_numbers', hasMany: true, options: ['a'] },
        { name: 'scores', type: 'number', hasMany: true },
      ])

      expect(adapter.tableNameMap.get('p_values')).toBe('p_numbers_field')
      expect(adapter.rawTables.p_numbers_field.columns.value).toMatchObject({
        enumName: 'enum_p_numbers_field',
      })
      expect(adapter.rawTables.p_numbers.columns.number).toBeDefined()
    })

    it('should keep the enumName of a hasMany select that sets one', async () => {
      const adapter = await buildCollection([
        {
          name: 'tags',
          type: 'select',
          dbName: 'p_tags_custom',
          enumName: 'tags_enum',
          hasMany: true,
          options: ['a'],
        },
      ])

      expect(adapter.rawTables.p_tags_custom.columns.value).toMatchObject({
        enumName: 'tags_enum',
      })
    })

    it('should not report a locales table for an array whose only localized field is a hasMany number', async () => {
      const config = await sanitizeConfig({
        collections: [
          {
            slug: 'p',
            fields: [
              {
                name: 'items',
                type: 'array',
                fields: [{ name: 'scores', type: 'number', hasMany: true, localized: true }],
              },
              {
                name: 'withTitle',
                type: 'array',
                fields: [{ name: 'title', type: 'text', localized: true }],
              },
            ],
            timestamps: false,
            versions: false,
          },
        ],
        localization: { defaultLocale: 'en', locales: ['en', 'es'] },
      } as Config)
      const adapter = createAdapter(config)

      buildRawSchema({ adapter, setColumnID })

      expect(hasCompanionRelation({ adapter, relation: '_locales', tableName: 'p_items' })).toBe(
        false,
      )
      expect(
        hasCompanionRelation({ adapter, relation: '_locales', tableName: 'p_with_title' }),
      ).toBe(true)
    })

    it('should warn about renamed tables', async () => {
      const adapter = await buildCollection([
        { name: 'numbers', type: 'array', fields: [{ name: 'drawPosition', type: 'number' }] },
        { name: 'scores', type: 'number', hasMany: true },
      ])
      const warn = vi.fn()

      warnRenamedSubTables({ adapter: { ...adapter, payload: { logger: { warn } } } as any })

      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0][0]).toContain('p_numbers -> p_numbers_field')
    })

    it('should warn with the name a nested table had before its parent was renamed', async () => {
      const config = await sanitizeConfig({
        collections: [
          {
            slug: 'p',
            fields: [
              {
                name: 'numbers',
                type: 'array',
                fields: [
                  { name: 'title', type: 'text', localized: true },
                  { name: 'locales', type: 'array', fields: [{ name: 'code', type: 'text' }] },
                ],
              },
              { name: 'scores', type: 'number', hasMany: true },
            ],
            timestamps: false,
            versions: false,
          },
        ],
        localization: { defaultLocale: 'en', locales: ['en', 'de'] },
      } as Config)
      const adapter = createAdapter(config)
      const warn = vi.fn()

      buildRawSchema({ adapter, setColumnID })
      warnRenamedSubTables({ adapter: { ...adapter, payload: { logger: { warn } } } as any })

      expect(warn.mock.calls[0][0]).toContain('p_numbers_locales -> p_numbers_field_locales_field')
      expect(warn.mock.calls[0][0]).not.toContain('p_numbers_field_locales ->')
    })

    it('should not warn when no table was renamed', async () => {
      const adapter = await buildCollection([
        { name: 'numbers', type: 'array', fields: [{ name: 'drawPosition', type: 'number' }] },
      ])
      const warn = vi.fn()

      warnRenamedSubTables({ adapter: { ...adapter, payload: { logger: { warn } } } as any })

      expect(warn).not.toHaveBeenCalled()
    })
  })
})

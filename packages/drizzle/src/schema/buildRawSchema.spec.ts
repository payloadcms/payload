import type { Block, Config, SanitizedConfig } from 'payload'
import { sanitizeConfig } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { setColumnID } from '../postgres/schema/setColumnID.js'
import type { DrizzleAdapter } from '../types.js'
import { checkTruncatedIdentifiers } from '../utilities/checkTruncatedIdentifiers.js'
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
      blocks: ['headline'],
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
    tableNameMap: new Map(),
    versionsSuffix: '_versions',
  }) as unknown as DrizzleAdapter

describe('buildRawSchema', () => {
  it('should create suffixed block tables for different schemas with the same slug', async () => {
    const config = sanitizeConfig({
      collections: [
        {
          slug: 'pages',
          fields: [
            {
              name: 'primaryContent',
              type: 'blocks',
              localized: true,
              blocks: [
                {
                  slug: 'content',
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
            {
              name: 'secondaryContent',
              type: 'blocks',
              localized: true,
              blocks: [
                {
                  slug: 'content',
                  fields: [
                    {
                      name: 'description',
                      type: 'textarea',
                    },
                  ],
                },
              ],
            },
          ],
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

    expect(adapter.rawTables.pages_blocks_content.columns.title).toBeDefined()
    expect(adapter.rawTables.pages_blocks_content.columns._locale).toBeDefined()
    expect(adapter.rawTables.pages_blocks_content_2.columns.description).toBeDefined()
    expect(adapter.rawTables.pages_blocks_content_2.columns._locale).toBeDefined()
  })

  it('should not create duplicate suffixed block tables for identical reused blocks under localized ancestors', async () => {
    const layoutBlocks = [createContainerBlock('container'), createContainerBlock('container50')]

    const config = sanitizeConfig({
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

  it('should lead the _locales unique index with _parent_id so parent-only lookups use it', async () => {
    const config = sanitizeConfig({
      collections: [
        {
          slug: 'posts',
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
            },
          ],
          versions: true,
        },
      ],
      localization: {
        defaultLocale: 'en',
        locales: ['en', 'de'],
      },
    } as Config)

    const adapter = createAdapter(config)

    buildRawSchema({ adapter, setColumnID })

    const localesIndex = adapter.rawTables.posts_locales?.indexes._localeParent
    expect(localesIndex).toBeDefined()
    expect(localesIndex?.unique).toBe(true)
    expect(localesIndex?.on).toEqual(['_parentID', '_locale'])

    const versionLocalesIndex = adapter.rawTables._posts_versions_locales?.indexes._localeParent
    expect(versionLocalesIndex).toBeDefined()
    expect(versionLocalesIndex?.unique).toBe(true)
    expect(versionLocalesIndex?.on).toEqual(['_parentID', '_locale'])
  })

  it('should warn when a localized field pushes the _locales companion table past 63 chars', async () => {
    // Base table name (61 chars) is under the limit, but `${base}_locales` (69) overflows it.
    const longSlug = `localized_collection_${'x'.repeat(40)}`

    const config = sanitizeConfig({
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
          versions: false,
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
    const config = sanitizeConfig({
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
          versions: false,
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

    const config = sanitizeConfig({
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
          versions: false,
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

    const config = sanitizeConfig({
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
    const config = sanitizeConfig({
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

  it('should keep sub-table index and foreign key names of up to 63 chars unchanged', () => {
    // `p_` + 48 chars + `_parent_id_idx` is 64 chars, `_parent_id_fk` 63 and `_order_idx` 60.
    // Only the index over 63 chars is renamed; names Postgres already stores in full stay as they are.
    const arrayFieldName = 'a'.repeat(48)

    const config = sanitizeConfig({
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

  it('should not rename long sub-table identifiers on other tables when a sibling field is added', () => {
    const prefix = 'x'.repeat(54)

    const buildArrayTable = (fieldNames: string[]) => {
      const config = sanitizeConfig({
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

    const before = buildArrayTable([`${prefix}_alpha`, `${prefix}_beta`])
    const after = buildArrayTable([`${prefix}_aaa`, `${prefix}_alpha`, `${prefix}_beta`])

    expect(after).toEqual(before)
  })

  it('should not rename identifiers or move foreign keys on non-Postgres adapters', () => {
    const arrayFieldName = 'a'.repeat(58)
    const groupName = 'g'.repeat(40)

    const config = sanitizeConfig({
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
})

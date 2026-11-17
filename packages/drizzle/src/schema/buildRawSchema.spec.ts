import type { Block, CollectionConfig, Config, SanitizedConfig } from 'payload'
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
): DrizzleAdapter =>
  ({
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

  it('should warn about raw inline sub-table index and foreign key names that exceed 63 chars', async () => {
    // Array sub-tables assign structural index/FK names inline (not via buildIndexName/
    // buildForeignKeyName), so a long-but-valid array table name still overflows them.
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

    const arrayTable = `p_${arrayFieldName}`

    checkTruncatedIdentifiers({ adapter, logWarnings: true })

    expect(arrayTable.length).toBeLessThanOrEqual(63)
    expect(warn).toHaveBeenCalledTimes(1)

    const message: string = warn.mock.calls[0][0]

    expect(message).toContain(`${arrayTable}_order_idx`)
    expect(message).toContain(`${arrayTable}_parent_id_fk`)
  })

  describe('sub-tables named like a companion table', () => {
    const buildCollection = (fields: CollectionConfig['fields']) => {
      const config = sanitizeConfig({
        collections: [
          { slug: 'p', fields, timestamps: false, versions: false },
          { slug: 'authors', fields: [], timestamps: false, versions: false },
        ],
      } as Config)

      const adapter = createAdapter(config)

      buildRawSchema({ adapter, setColumnID })

      return adapter
    }

    it('should rename an array table that shares its name with the relationships table', () => {
      const adapter = buildCollection([
        { name: 'rels', type: 'array', fields: [{ name: 'value', type: 'text' }] },
        { name: 'authors', type: 'relationship', hasMany: true, relationTo: 'authors' },
      ])

      expect(adapter.tableNameMap.get('p_rels')).toBe('p_rels_field')
      expect(adapter.rawTables.p_rels_field.columns.value).toBeDefined()
      expect(adapter.rawTables.p_rels.columns.authorsID).toBeDefined()
      expect(adapter.rawTables.p_rels.columns.value).toBeUndefined()
    })

    it('should rename array and select tables that share their names with the texts and numbers tables', () => {
      const adapter = buildCollection([
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

    it('should keep the table name when there is no companion table with that name', () => {
      // No `hasMany` number or text fields, so there are no `p_numbers` or `p_texts` companion tables.
      const adapter = buildCollection([
        { name: 'numbers', type: 'array', fields: [{ name: 'drawPosition', type: 'number' }] },
        { name: 'texts', type: 'array', fields: [{ name: 'value', type: 'text' }] },
      ])

      expect(adapter.tableNameMap.get('p_numbers')).toBe('p_numbers')
      expect(adapter.tableNameMap.get('p_texts')).toBe('p_texts')
      expect(adapter.rawTables.p_numbers.columns.drawPosition).toBeDefined()
      expect(adapter.rawTables.p_texts.columns.value).toBeDefined()
      expect(adapter.rawTables.p_numbers_field).toBeUndefined()
    })
  })
})

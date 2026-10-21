import type { Block, Config, SanitizedConfig } from 'payload'
import { sanitizeConfig } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  branchProjectionLocaleKey,
  isRegisteredBranchProjection,
} from '../branching/projectionLocaleNamespace.js'
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
    tableNameMap: new Map(),
    versionsSuffix: '_versions',
  }) as unknown as DrizzleAdapter

describe('buildRawSchema', () => {
  it.each(['postgres', 'sqlite'])(
    'should scope only registered PostgreSQL root locale tables with adapter %s',
    (name) => {
      const config = sanitizeConfig({
        collections: [
          {
            slug: 'source',
            fields: [{ name: 'title', type: 'text', localized: true }],
          },
          {
            slug: 'projection',
            dbName: 'p'.repeat(50),
            versions: false,
            fields: [
              { name: 'id', type: 'text' },
              { name: 'title', type: 'text', localized: true },
              { name: '_branchProjection_branchKey', type: 'text', localized: true },
              {
                name: '_branchProjection',
                type: 'group',
                fields: [{ name: 'branchKey', type: 'text', required: true }],
              },
              {
                name: 'rows',
                type: 'array',
                fields: [{ name: 'title', type: 'text', localized: true }],
              },
            ],
          },
          {
            slug: 'ordinary',
            custom: { branchProjectionStorage: { collection: 'source' } },
            fields: [{ name: '_branchProjection_branchKey', type: 'text', localized: true }],
          },
        ],
        localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
      } as Config)
      const source = config.collections.find(({ slug }) => slug === 'source')!
      const projection = config.collections.find(({ slug }) => slug === 'projection')!
      const ordinary = config.collections.find(({ slug }) => slug === 'ordinary')!

      source.custom = { branchQueryStorage: { projection: projection.slug } }
      projection.custom = { branchProjectionStorage: { collection: source.slug } }

      const adapter = createAdapter(config)

      adapter.name = name
      buildRawSchema({ adapter, setColumnID })

      const tableName = adapter.tableNameMap.get('projection')!
      const localized = adapter.rawTables[`${tableName}_locales`]!
      const index = localized.indexes._branchLocale

      expect(isRegisteredBranchProjection({ collection: projection, config })).toBe(true)
      expect(isRegisteredBranchProjection({ collection: ordinary, config })).toBe(false)
      expect(localized.columns._branchProjection_branchKey).toMatchObject({ type: 'varchar' })
      if (name === 'postgres') {
        expect(localized.columns[branchProjectionLocaleKey]).toEqual({
          name: branchProjectionLocaleKey,
          type: 'text',
          notNull: true,
        })
        expect(index.on).toEqual([branchProjectionLocaleKey, '_locale'])
        expect(index.name.length).toBeLessThanOrEqual(63)
      } else {
        expect(Object.keys(localized.columns)).not.toContain(branchProjectionLocaleKey)
        expect(index).toBeUndefined()
      }
      for (const table of Object.values(adapter.rawTables)) {
        if (table !== localized) {
          expect(Object.keys(table.columns)).not.toContain(branchProjectionLocaleKey)
        }
      }
    },
  )

  it('should recognize a registered global projection and reject ambiguous descriptors', () => {
    const config = sanitizeConfig({
      collections: [
        {
          slug: 'projection',
          fields: [
            {
              name: '_branchProjection',
              type: 'group',
              fields: [{ name: 'branchKey', type: 'text', required: true }],
            },
          ],
        },
      ],
      globals: [{ slug: 'settings', fields: [] }],
    } as Config)
    const projection = config.collections.find(({ slug }) => slug === 'projection')!
    const source = config.globals.find(({ slug }) => slug === 'settings')!

    source.custom = { branchQueryStorage: { projection: projection.slug } }
    projection.custom = { branchProjectionStorage: { global: source.slug } }
    expect(isRegisteredBranchProjection({ collection: projection, config })).toBe(true)

    projection.custom.branchProjectionStorage.collection = source.slug
    expect(isRegisteredBranchProjection({ collection: projection, config })).toBe(false)
  })

  it('should reject a public field using the private raw namespace delimiter', () => {
    expect(() =>
      sanitizeConfig({
        collections: [
          { slug: 'source', fields: [{ name: branchProjectionLocaleKey, type: 'text' }] },
        ],
      } as Config),
    ).toThrow('can not include periods')
  })

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
})

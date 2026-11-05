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
      blockReferences: ['headline'],
      blocks: [],
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
    expect(arrayTable.indexes._orderIdx.name.length).toBeLessThanOrEqual(63)
    expect(arrayTable.indexes._parentIDIdx.name.length).toBeLessThanOrEqual(63)
    expect(arrayTable.foreignKeys._parentIDFk.name.length).toBeLessThanOrEqual(63)

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
})

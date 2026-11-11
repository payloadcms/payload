import type { Config } from 'payload'
import { sanitizeConfig } from 'payload'
import { describe, expect, it } from 'vitest'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import type { DrizzleAdapter } from '../../types.js'
import { getTableColumnFromPath } from '../../queries/getTableColumnFromPath.js'
import { buildRawSchema } from '../../schema/buildRawSchema.js'
import { setColumnID } from '../../postgres/schema/setColumnID.js'
import { transform } from '../../transform/read/index.js'

function createAdapter({
  hasVersions = false,
  hasNumericID = false,
}: { hasVersions?: boolean; hasNumericID?: boolean } = {}) {
  const config = sanitizeConfig({
    collections: [
      {
        slug: 'pages',
        versions: hasVersions,
        fields: [
          {
            name: 'items',
            type: 'array',
            fields: [
              ...(hasNumericID ? [{ name: 'id', type: 'number' as const }] : []),
              { name: 'label', type: 'text' },
            ],
          },
          {
            name: 'layout',
            type: 'blocks',
            blocks: [{ slug: 'content', fields: [{ name: 'label', type: 'text' }] }],
          },
        ],
      },
    ],
    globals: [
      {
        slug: 'header',
        versions: hasVersions,
        fields: [{ name: 'items', type: 'array', fields: [{ name: 'label', type: 'text' }] }],
      },
    ],
    secret: 'test',
  } as Config)
  const adapter = {
    blocksAsJSON: false,
    fieldConstraints: {},
    idType: 'serial',
    localesSuffix: '_locales',
    payload: {
      config,
      blocks: Object.fromEntries(config.blocks.map((block) => [block.slug, block])),
      collections: Object.fromEntries(
        config.collections.map((collection) => [
          collection.slug,
          { config: collection, customIDType: undefined },
        ]),
      ),
    },
    rawRelations: {},
    rawTables: {},
    tableNameMap: new Map(),
    versionsSuffix: '_versions',
  } as unknown as DrizzleAdapter

  buildRawSchema({ adapter, setColumnID })
  return adapter
}

describe('uniform SQL row storage', () => {
  it.each([false, true])(
    'should separate public and storage IDs with versions=%s',
    (hasVersions) => {
      const adapter = createAdapter({ hasVersions })

      for (const name of ['pages_items', 'pages_blocks_content', 'header_items']) {
        expect(adapter.rawTables[name].columns.id).toMatchObject({
          type: 'serial',
          primaryKey: true,
        })
        expect(adapter.rawTables[name].columns._uuid).toMatchObject({ type: 'varchar' })
      }
    },
  )
  it('should preserve a zero custom public ID when reading', () => {
    const adapter = createAdapter({ hasNumericID: true })
    const fields = adapter.payload.config.collections.find(
      ({ slug }) => slug === 'pages',
    ).flattenedFields
    const result = transform({
      adapter,
      config: adapter.payload.config,
      fields,
      tableName: 'pages',
      data: { id: 1, items: [{ id: 17, _uuid: 0, label: 'Zero' }] },
    })

    expect(result.items[0]).toMatchObject({ id: 0, label: 'Zero' })
    expect(result.items[0]).not.toHaveProperty('_uuid')
  })
  it('should query the public ID column and retain physical keys for joins', () => {
    const adapter = createAdapter()
    const rows = sqliteTable('pages_items', {
      id: integer('id').primaryKey(),
      _uuid: text('_uuid'),
    })

    adapter.tables = { pages_items: rows } as never
    const result = getTableColumnFromPath({
      adapter,
      fields: [{ name: 'id', type: 'text' }],
      joins: [],
      parentIsLocalized: false,
      pathSegments: ['id'],
      selectFields: {},
      tableName: 'pages_items',
      value: 'logical-id',
    })

    expect(result.columnName).toBe('_uuid')
    expect(result.table[result.columnName]).toBe(rows._uuid)
  })
})

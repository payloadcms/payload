import type { Client } from '@libsql/client'
import type { FlattenedField, Where } from 'payload'

import { createClient } from '@libsql/client'
import { like, notLike } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { afterAll, describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'
import type { PolymorphicJoinWherePlan } from './createPolymorphicJoinWherePlan.js'

import { operatorMap } from '../queries/operatorMap.js'
import { convertPathToJSONTraversal } from '../sqlite/createJSONQuery/convertPathToJSONTraversal.js'
import { createJSONQuery } from '../sqlite/createJSONQuery/index.js'
import { buildPolymorphicJoinWhere } from './buildPolymorphicJoinWhere.js'

const articlesTable = sqliteTable('join_articles', {
  id: integer('id').primaryKey(),
  parent: integer('parent_id'),
  score: integer('score'),
  settings: text('settings'),
  title: text('title'),
})

const notesTable = sqliteTable('join_notes', {
  id: integer('id').primaryKey(),
  parent: integer('parent_id'),
  title: text('title'),
})

const articlesLocalesTable = sqliteTable('join_articles_locales', {
  id: integer('id').primaryKey(),
  _locale: text('_locale'),
  _parentID: integer('_parent_id'),
  localizedTitle: text('localized_title'),
})

const articlesEntriesTable = sqliteTable('join_articles_entries', {
  id: integer('id').primaryKey(),
  _parentID: integer('_parent_id'),
})

const articlesEntriesTagsTable = sqliteTable('join_articles_entries_tags', {
  id: integer('id').primaryKey(),
  parent: integer('parent_id'),
  value: text('value'),
})

const articlesBlocksHeroTable = sqliteTable('join_articles_blocks_hero', {
  id: integer('id').primaryKey(),
  _parentID: integer('_parent_id'),
  _path: text('_path'),
  label: text('label'),
})

const client: Client = createClient({ url: 'file::memory:' })
const db = drizzle(client, { schema: { articlesTable, notesTable } })
const textField = { name: 'title', type: 'text' } as FlattenedField
const numberField = { name: 'score', type: 'number' } as FlattenedField
const hasManySelectField = {
  hasMany: true,
  name: 'tags',
  options: ['available', 'reviewed'],
  type: 'select',
} as FlattenedField

const adapter = {
  convertPathToJSONTraversal,
  createJSONQuery,
  drizzle: db,
  idType: 'serial',
  name: 'sqlite',
  operatorHandlers: [],
  operators: {
    ...operatorMap,
    contains: like,
    like,
    not_like: notLike,
  },
  payload: { collections: {} },
  tableNameMap: new Map([
    ['articles_tags', 'join_articles_tags'],
    ['notes_tags', 'join_notes_tags'],
  ]),
  tables: {
    join_articles: articlesTable,
    join_articles_blocks_hero: articlesBlocksHeroTable,
    join_articles_entries: articlesEntriesTable,
    join_articles_entries_tags: articlesEntriesTagsTable,
    join_articles_locales: articlesLocalesTable,
    join_notes: notesTable,
  },
} as unknown as DrizzleAdapter

const scalarPlan = ({
  collections = ['articles'],
  columnPath,
  field = textField,
  schemaPath = columnPath,
}: {
  collections?: string[]
  columnPath: string
  field?: FlattenedField
  schemaPath?: string
}): PolymorphicJoinWherePlan =>
  new Map([
    [
      schemaPath,
      {
        columnPath,
        fieldsByCollection: new Map(
          collections.map((collection) => [
            collection,
            { field, isUUID: false, type: 'scalar' as const },
          ]),
        ),
        schemaPath,
        type: 'scalar',
      },
    ],
  ])

const hasManySelectPlan = (
  collections = ['articles'],
  schemaPath = 'tags',
): PolymorphicJoinWherePlan =>
  new Map([
    [
      schemaPath,
      {
        columnPath: schemaPath.replaceAll('.', '_'),
        fieldsByCollection: new Map(
          collections.map((collection) => [
            collection,
            { field: hasManySelectField, type: 'hasManySelect' as const },
          ]),
        ),
        schemaPath,
        type: 'hasManySelect',
      },
    ],
  ])

const jsonPathPlan = (
  collections = ['articles'],
  schemaPath = 'settings.approved',
): PolymorphicJoinWherePlan => {
  const [jsonColumnPath, ...jsonPathSegments] = schemaPath.split('.')

  return new Map([
    [
      schemaPath,
      {
        columnPath: schemaPath.replaceAll('.', '_'),
        fieldsByCollection: new Map(
          collections.map((collection) => [
            collection,
            {
              field: { name: jsonColumnPath, type: 'json' } as FlattenedField,
              jsonColumnPath,
              jsonPathSegments,
              type: 'jsonPath' as const,
            },
          ]),
        ),
        schemaPath,
        type: 'jsonPath',
      },
    ],
  ])
}

const localizedScalarChain = {
  hops: [
    {
      isLocalesTable: true,
      localeColumnKey: '_locale',
      parentColumnKey: '_parentID',
      tableName: 'join_articles_locales',
    },
  ],
  leafColumnKey: 'localizedTitle',
}

const arraySelectChain = {
  hops: [
    { isLocalesTable: false, parentColumnKey: '_parentID', tableName: 'join_articles_entries' },
    { isLocalesTable: false, parentColumnKey: 'parent', tableName: 'join_articles_entries_tags' },
  ],
  leafColumnKey: 'value',
}

const blockChain = {
  hops: [
    {
      isLocalesTable: false,
      parentColumnKey: '_parentID',
      pathValue: 'content',
      tableName: 'join_articles_blocks_hero',
    },
  ],
  leafColumnKey: 'label',
}

const arrayBlockChain = {
  hops: [
    {
      isLocalesTable: false,
      parentColumnKey: '_parentID',
      pathValue: 'entries.%.content',
      tableName: 'join_articles_blocks_hero',
    },
  ],
  leafColumnKey: 'label',
}

const separateRowsPlan = ({
  chain,
  collections = ['articles'],
  field = textField,
  schemaPath,
}: {
  chain: unknown
  collections?: string[]
  field?: FlattenedField
  schemaPath: string
}): PolymorphicJoinWherePlan =>
  new Map([
    [
      schemaPath,
      {
        columnPath: schemaPath.replaceAll('.', '_'),
        fieldsByCollection: new Map(
          collections.map((collection) => [
            collection,
            { chain, field, type: 'separateRows' as const },
          ]),
        ),
        schemaPath,
        type: 'separateRows',
      },
    ],
  ]) as unknown as PolymorphicJoinWherePlan

const renderWhere = ({
  collection = 'articles',
  locale = 'en',
  table = articlesTable,
  where,
  wherePlan,
}: {
  collection?: string
  locale?: string
  table?: typeof articlesTable | typeof notesTable
  where: Where
  wherePlan: PolymorphicJoinWherePlan
}) => {
  const condition = buildPolymorphicJoinWhere({
    adapter,
    collection,
    locale,
    table,
    where,
    wherePlan,
  })

  return db.select({ id: table.id }).from(table).where(condition).toSQL()
}

afterAll(() => client.close())

describe('buildPolymorphicJoinWhere', () => {
  it('builds scalar comparisons and preserves nested AND and OR groups', () => {
    const wherePlan = scalarPlan({ columnPath: 'title', collections: ['articles', 'notes'] })
    const query = renderWhere({
      where: {
        AND: [
          { title: { equals: 'available' } },
          { OR: [{ title: { equals: 'reviewed' } }, { title: { equals: 'published' } }] },
        ],
      },
      wherePlan,
    })

    expect(query.sql).toContain('where ("join_articles"."title" = ? and')
    expect(query.sql).toContain('or')
    expect(query.params).toEqual(['available', 'reviewed', 'published'])
  })

  it('uses equality for a numeric like constraint', () => {
    const query = renderWhere({
      where: { score: { like: '5' } },
      wherePlan: scalarPlan({ columnPath: 'score', field: numberField }),
    })

    expect(query.sql).toContain('"join_articles"."score" = ?')
    expect(query.params).toEqual([5])
  })

  it('uses SQL NULL for a scalar field that is absent from the current collection', () => {
    const query = renderWhere({
      collection: 'notes',
      table: notesTable,
      where: { score: { exists: false } },
      wherePlan: scalarPlan({ columnPath: 'score', collections: ['articles'], field: numberField }),
    })

    expect(query.sql).toContain('where null is null')
    expect(query.params).toEqual([])
  })

  it.each([
    ['exists', { exists: 'false' }, 'where null is null', []],
    ['in', { in: '1,2' }, 'where null in (?, ?)', [1, 2]],
  ] as const)(
    'normalizes a REST %s value when a scalar field is absent from the current collection',
    (_operator, constraint, expectedSQL, expectedParams) => {
      const query = renderWhere({
        collection: 'notes',
        table: notesTable,
        where: { score: constraint } as unknown as Where,
        wherePlan: scalarPlan({
          columnPath: 'score',
          collections: ['articles'],
          field: numberField,
        }),
      })

      expect(query.sql).toContain(expectedSQL)
      expect(query.params).toEqual(expectedParams)
    },
  )

  it('keeps contains wildcard handling when a scalar field is absent', () => {
    const query = renderWhere({
      collection: 'notes',
      table: notesTable,
      where: { score: { contains: '5' } },
      wherePlan: scalarPlan({ columnPath: 'score', collections: ['articles'], field: numberField }),
    })

    expect(query.sql).toContain('where null like ?')
    expect(query.params).toEqual(['%5%'])
  })

  it('compares relationTo with the current collection slug', () => {
    const wherePlan: PolymorphicJoinWherePlan = new Map([
      [
        'relationTo',
        {
          columnPath: 'relationTo',
          fieldsByCollection: new Map(),
          schemaPath: 'relationTo',
          type: 'scalar',
        },
      ],
    ])
    const query = renderWhere({
      collection: 'notes',
      table: notesTable,
      where: { relationTo: { equals: 'notes' } },
      wherePlan,
    })

    expect(query.sql).toContain('where ? = ?')
    expect(query.params).toEqual(['notes', 'notes'])
  })

  it.each([
    ['exists', { exists: 'false' }, 'where ? is null', ['notes']],
    ['in', { in: 'articles,notes' }, 'where ? in (?, ?)', ['notes', 'articles', 'notes']],
  ] as const)(
    'normalizes a REST %s value for relationTo',
    (_operator, constraint, expectedSQL, expectedParams) => {
      const wherePlan: PolymorphicJoinWherePlan = new Map([
        [
          'relationTo',
          {
            columnPath: 'relationTo',
            fieldsByCollection: new Map(),
            schemaPath: 'relationTo',
            type: 'scalar',
          },
        ],
      ])
      const query = renderWhere({
        collection: 'notes',
        table: notesTable,
        where: { relationTo: constraint } as unknown as Where,
        wherePlan,
      })

      expect(query.sql).toContain(expectedSQL)
      expect(query.params).toEqual(expectedParams)
    },
  )

  it.each([
    ['equals null', { title: { equals: null } }, '"join_articles"."title" is null', []],
    ['not_equals null', { title: { not_equals: null } }, '"join_articles"."title" is not null', []],
    [
      'not_equals a value',
      { title: { not_equals: 'restricted' } },
      '"join_articles"."title" is null or "join_articles"."title" <> ?',
      ['restricted'],
    ],
    [
      'in values including null',
      { title: { in: ['available', null] } },
      '"join_articles"."title" is null or "join_articles"."title" in (?)',
      ['available'],
    ],
  ] as const)('keeps null semantics for %s', (_description, where, expectedSQL, expectedParams) => {
    const query = renderWhere({
      where: where as unknown as Where,
      wherePlan: scalarPlan({ columnPath: 'title' }),
    })

    expect(query.sql).toContain(expectedSQL)
    expect(query.params).toEqual(expectedParams)
  })

  it('requires every word in a scalar like comparison', () => {
    const query = renderWhere({
      where: { title: { like: 'available child' } },
      wherePlan: scalarPlan({ columnPath: 'title' }),
    })

    expect(query.sql).toContain('"join_articles"."title" like ? and')
    expect(query.params).toEqual(['%available%', '%child%'])
  })

  it('queries a has-many select through its value table', () => {
    const query = renderWhere({
      where: { tags: { contains: 'available' } },
      wherePlan: hasManySelectPlan(),
    })

    expect(query.sql).toContain('json_group_array(join_articles_tags.value)')
    expect(query.sql).toContain("value = 'available'")
  })

  it.each([
    [
      'a REST exists value',
      { exists: 'false' },
      ['NOT EXISTS (SELECT 1 FROM json_each(', 'AS tags_alias_0)'],
    ],
    [
      'a comma-delimited REST in value',
      { in: 'available,reviewed' },
      ["tags_alias_0.value = 'available'", ' OR ', "tags_alias_0.value = 'reviewed'"],
    ],
  ] as const)('normalizes %s for has-many selects', (_description, constraint, fragments) => {
    const query = renderWhere({
      where: { tags: constraint } as unknown as Where,
      wherePlan: hasManySelectPlan(),
    })

    for (const fragment of fragments) {
      expect(query.sql).toContain(fragment)
    }
  })

  it.each([
    ['without a schema', undefined],
    ['with a schema', 'content'],
  ] as const)(
    'rejects a missing has-many select value table mapping %s',
    (_description, schemaName) => {
      const adapterWithoutValueTable = {
        ...adapter,
        schemaName,
        tableNameMap: new Map(),
      } as unknown as DrizzleAdapter

      expect(() =>
        buildPolymorphicJoinWhere({
          adapter: adapterWithoutValueTable,
          collection: 'articles',
          table: articlesTable,
          where: { tags: { equals: 'available' } },
          wherePlan: hasManySelectPlan(),
        }),
      ).toThrow('Polymorphic join collection "articles" has no value table for "tags"')
    },
  )

  it('uses an empty JSON array when a has-many select is absent from this collection', () => {
    const query = renderWhere({
      collection: 'notes',
      table: notesTable,
      where: { tags: { exists: false } },
      wherePlan: hasManySelectPlan(['articles']),
    })

    expect(query.sql).toContain("json_each('[]')")
    expect(query.sql).not.toContain('join_notes_tags')
  })

  it.each([
    ['equals', { equals: 'available' }, `"settings"->>'approved' = 'available'`],
    ['a boolean equals', { equals: true }, `"settings"->>'approved' = true`],
    ['contains', { contains: 'avail' }, `"settings"->>'approved' like '%avail%'`],
    ['exists', { exists: true }, `"settings"->>'approved' is not null`],
    ['a REST exists value', { exists: 'false' }, `"settings"->>'approved' is null`],
    [
      'a comma-delimited in value',
      { in: 'available,reviewed' },
      `"settings"->>'approved' in ('available','reviewed')`,
    ],
  ] as const)('builds %s against a json sub-path', (_description, constraint, expectedSQL) => {
    const query = renderWhere({
      where: { 'settings.approved': constraint } as unknown as Where,
      wherePlan: jsonPathPlan(),
    })

    expect(query.sql).toContain(expectedSQL)
  })

  it.each([
    ['matches nothing for equals', { equals: 'available' }, 'where false'],
    ['matches nothing for exists true', { exists: true }, 'where false'],
    ['matches every row for exists false', { exists: false }, 'where true'],
  ] as const)(
    'a json sub-path absent from this collection %s',
    (_description, constraint, expectedSQL) => {
      const query = renderWhere({
        collection: 'notes',
        table: notesTable,
        where: { 'settings.approved': constraint } as unknown as Where,
        wherePlan: jsonPathPlan(['articles']),
      })

      expect(query.sql).toContain(expectedSQL)
      expect(query.sql).not.toContain('settings')
    },
  )

  it.each([
    ['a negated operator', { not_equals: 'available' }, 'settings.approved.not_equals'],
    ['a null value', { equals: null }, 'settings.approved.equals'],
    ['an object value', { equals: { nested: true } }, 'settings.approved.equals'],
    ['a $raw constraint', { $raw: 'true' }, 'settings.approved.$raw'],
  ] as const)('rejects %s on a json sub-path', (_description, constraint, expectedPath) => {
    expect(() =>
      renderWhere({
        where: { 'settings.approved': constraint } as unknown as Where,
        wherePlan: jsonPathPlan(),
      }),
    ).toThrow(expectedPath)
  })

  it('correlates a localized path to the branch row and filters by locale', () => {
    const query = renderWhere({
      where: { localizedTitle: { equals: 'available' } },
      wherePlan: separateRowsPlan({ chain: localizedScalarChain, schemaPath: 'localizedTitle' }),
    })

    expect(query.sql).toContain('exists (select 1 from "join_articles_locales"')
    expect(query.sql).toContain('"_parent_id" = "join_articles"."id"')
    expect(query.sql).toContain('"_locale" = ?')
    expect(query.sql).toContain('"localized_title" = ?')
    expect(query.params).toEqual(['en', 'available'])
  })

  it('omits the locale filter when every locale is requested', () => {
    const query = renderWhere({
      locale: 'all',
      where: { localizedTitle: { equals: 'available' } },
      wherePlan: separateRowsPlan({ chain: localizedScalarChain, schemaPath: 'localizedTitle' }),
    })

    expect(query.sql).not.toContain('"_locale" = ?')
    expect(query.params).toEqual(['available'])
  })

  it('rejects a localized path when no locale is available', () => {
    expect(() =>
      buildPolymorphicJoinWhere({
        adapter,
        collection: 'articles',
        table: articlesTable,
        where: { localizedTitle: { equals: 'available' } },
        wherePlan: separateRowsPlan({ chain: localizedScalarChain, schemaPath: 'localizedTitle' }),
      }),
    ).toThrow('localizedTitle.equals')
  })

  it('negates a single-locale path with NOT EXISTS around the positive comparison', () => {
    const query = renderWhere({
      where: { localizedTitle: { not_equals: 'available' } },
      wherePlan: separateRowsPlan({ chain: localizedScalarChain, schemaPath: 'localizedTitle' }),
    })

    expect(query.sql).toContain('not exists (select 1 from "join_articles_locales"')
    expect(query.sql).toContain('"localized_title" = ?')
    expect(query.sql).not.toContain('<>')
    expect(query.params).toEqual(['en', 'available'])
  })

  it('nests one correlated subquery per hop for a path stored under an array', () => {
    const query = renderWhere({
      where: { 'entries.tags': { equals: 'available' } },
      wherePlan: separateRowsPlan({
        chain: arraySelectChain,
        field: hasManySelectField,
        schemaPath: 'entries.tags',
      }),
    })

    expect(query.sql).toContain('exists (select 1 from "join_articles_entries"')
    expect(query.sql).toContain('"_parent_id" = "join_articles"."id"')
    expect(query.sql).toContain('exists (select 1 from "join_articles_entries_tags"')
    expect(query.sql).toContain('"value" = ?')
    expect(query.params).toEqual(['available'])
  })

  it('treats exists false on a many-row path as an absence check', () => {
    const query = renderWhere({
      where: { 'entries.tags': { exists: false } },
      wherePlan: separateRowsPlan({
        chain: arraySelectChain,
        field: hasManySelectField,
        schemaPath: 'entries.tags',
      }),
    })

    expect(query.sql).toContain('not exists (select 1 from "join_articles_entries"')
    expect(query.sql).toContain('"value" is not null')
  })

  it.each([
    ['not_equals', { not_equals: 'available' }, 'entries.tags.not_equals'],
    ['not_in', { not_in: ['available'] }, 'entries.tags.not_in'],
    ['not_like', { not_like: 'available' }, 'entries.tags.not_like'],
  ] as const)('rejects %s on a path stored in many rows', (_description, constraint, errorPath) => {
    expect(() =>
      renderWhere({
        where: { 'entries.tags': constraint } as unknown as Where,
        wherePlan: separateRowsPlan({
          chain: arraySelectChain,
          field: hasManySelectField,
          schemaPath: 'entries.tags',
        }),
      }),
    ).toThrow(errorPath)
  })

  it('filters block rows by the blocks field path', () => {
    const query = renderWhere({
      where: { 'content.hero.label': { equals: 'available' } },
      wherePlan: separateRowsPlan({ chain: blockChain, schemaPath: 'content.hero.label' }),
    })

    expect(query.sql).toContain('exists (select 1 from "join_articles_blocks_hero"')
    expect(query.sql).toContain('"_path" = ?')
    expect(query.params).toEqual(['content', 'available'])
  })

  it.each([
    ['equals', { equals: 'available' }, 'where false'],
    ['exists true', { exists: true }, 'where false'],
    ['exists false', { exists: false }, 'where true'],
    ['a REST exists false value', { exists: 'false' }, 'where true'],
    ['not_equals', { not_equals: 'available' }, 'where true'],
    ['not_equals null', { not_equals: null }, 'where false'],
    ['in without null', { in: ['available'] }, 'where false'],
    ['in with null', { in: ['available', null] }, 'where true'],
    ['not_in', { not_in: ['available'] }, 'where false'],
  ] as const)(
    'resolves %s from the operator when the path is absent from this collection',
    (_description, constraint, expectedSQL) => {
      const query = renderWhere({
        collection: 'notes',
        table: notesTable,
        where: { localizedTitle: constraint } as unknown as Where,
        wherePlan: separateRowsPlan({
          chain: localizedScalarChain,
          collections: ['articles'],
          schemaPath: 'localizedTitle',
        }),
      })

      expect(query.sql).toContain(expectedSQL)
      expect(query.sql).not.toContain('join_articles_locales')
    },
  )

  it('rejects a negated operator with a null member in its list', () => {
    expect(() =>
      renderWhere({
        where: { localizedTitle: { not_in: ['blocked', null] } } as unknown as Where,
        wherePlan: separateRowsPlan({ chain: localizedScalarChain, schemaPath: 'localizedTitle' }),
      }),
    ).toThrow('localizedTitle.not_in')
  })

  it('keeps not_equals null as an existence check', () => {
    const query = renderWhere({
      where: { localizedTitle: { not_equals: null } },
      wherePlan: separateRowsPlan({ chain: localizedScalarChain, schemaPath: 'localizedTitle' }),
    })

    expect(query.sql).toContain('exists (select 1 from "join_articles_locales"')
    expect(query.sql).not.toContain('not exists')
    expect(query.sql).toContain('"localized_title" is not null')
  })

  it('rejects a block path that stands in for an array index', () => {
    expect(() =>
      renderWhere({
        where: { 'entries.content.hero.label': { equals: 'available' } },
        wherePlan: separateRowsPlan({
          chain: arrayBlockChain,
          schemaPath: 'entries.content.hero.label',
        }),
      }),
    ).toThrow('entries.content.hero.label.equals')
  })

  it('builds a false condition for an empty json sub-path in comparison', () => {
    const query = renderWhere({
      where: { 'settings.approved': { in: [] } },
      wherePlan: jsonPathPlan(),
    })

    expect(query.sql).toContain('where false')
  })

  it('rejects a json sub-path when the adapter cannot traverse JSON', () => {
    const adapterWithoutTraversal = {
      ...adapter,
      convertPathToJSONTraversal: undefined,
    } as unknown as DrizzleAdapter

    expect(() =>
      buildPolymorphicJoinWhere({
        adapter: adapterWithoutTraversal,
        collection: 'articles',
        table: articlesTable,
        where: { 'settings.approved': { equals: 'available' } },
        wherePlan: jsonPathPlan(),
      }),
    ).toThrow('settings.approved.equals')
  })

  it('builds a false condition for an empty has-many in comparison', () => {
    const query = renderWhere({
      where: { tags: { in: [] } },
      wherePlan: hasManySelectPlan(),
    })

    expect(query.sql).toContain('where false')
  })

  it('builds a false condition for an empty scalar in comparison', () => {
    const query = renderWhere({
      where: { title: { in: [] } },
      wherePlan: scalarPlan({ columnPath: 'title' }),
    })

    expect(query.sql).toContain('where false')
  })

  it.each([
    [
      'a scalar in value that cannot be normalized',
      { title: { in: true } },
      scalarPlan({ columnPath: 'title' }),
    ],
    [
      'an undefined scalar in value',
      { title: { in: undefined } },
      scalarPlan({ columnPath: 'title' }),
    ],
    [
      'a has-many select in value that cannot be normalized',
      { tags: { in: true } },
      hasManySelectPlan(),
    ],
  ] as const)('rejects %s', (_description, where, wherePlan) => {
    expect(() =>
      renderWhere({
        where: where as unknown as Where,
        wherePlan,
      }),
    ).toThrow(Object.keys(where)[0] === 'tags' ? 'tags.in' : 'title.in')
  })

  it.each(['AND', 'OR'] as const)(
    'rejects a value that cannot be normalized inside an %s group',
    (booleanOperator) => {
      expect(() =>
        renderWhere({
          where: {
            [booleanOperator]: [{ title: { in: true } }, { title: { equals: 'available' } }],
          } as unknown as Where,
          wherePlan: scalarPlan({ columnPath: 'title' }),
        }),
      ).toThrow('title.in')
    },
  )

  it.each([
    ['equals', { equals: 'available' }, ["tags_alias_0.value = 'available'"]],
    ['exists', { exists: true }, ['EXISTS (SELECT 1 FROM json_each(', 'AS tags_alias_0)']],
    [
      'in',
      { in: ['available', 'reviewed'] },
      ["tags_alias_0.value = 'available'", ' OR ', "tags_alias_0.value = 'reviewed'"],
    ],
    ['like', { like: 'avail' }, ["tags_alias_0.value like '%avail%'"]],
  ] as const)(
    'supports the %s operator for has-many selects',
    (_operator, constraint, expectedSQLFragments) => {
      const query = renderWhere({
        where: { tags: constraint } as unknown as Where,
        wherePlan: hasManySelectPlan(),
      })

      expect(query.sql).toContain('join_articles_tags')
      for (const expectedSQLFragment of expectedSQLFragments) {
        expect(query.sql).toContain(expectedSQLFragment)
      }
      expect(query.params).toEqual([])
    },
  )

  it('accepts a string $raw constraint', () => {
    const query = renderWhere({
      where: { title: { $raw: 'length(title) > 3' } } as unknown as Where,
      wherePlan: scalarPlan({ columnPath: 'title' }),
    })

    expect(query.sql).toContain('where length(title) > 3')
  })

  it.each([
    [
      'an invalid path plan',
      { title: { equals: 'available' } },
      new Map([
        [
          'title',
          {
            columnPath: 'title',
            fieldsByCollection: new Map(),
            schemaPath: 'title',
            type: 'invalid' as const,
          },
        ],
      ]),
      'title.equals',
    ],
    ['a missing path plan', { title: { equals: 'available' } }, new Map(), 'title'],
    [
      'an unsupported has-many operator',
      { tags: { not_equals: 'available' } },
      hasManySelectPlan(),
      'tags.not_equals',
    ],
    [
      'an unknown scalar operator',
      { title: { near: 'available' } },
      scalarPlan({ columnPath: 'title' }),
      'title.near',
    ],
    [
      'a non-string $raw value',
      { title: { $raw: 1 } },
      scalarPlan({ columnPath: 'title' }),
      'title.$raw',
    ],
  ] as const)('rejects %s', (_description, where, wherePlan, errorPath) => {
    expect(() =>
      buildPolymorphicJoinWhere({
        adapter,
        collection: 'articles',
        table: articlesTable,
        where: where as unknown as Where,
        wherePlan: wherePlan as PolymorphicJoinWherePlan,
      }),
    ).toThrow(errorPath)
  })

  it('returns no condition for empty boolean groups', () => {
    expect(
      buildPolymorphicJoinWhere({
        adapter,
        collection: 'articles',
        table: articlesTable,
        where: { AND: [], OR: [] },
        wherePlan: new Map(),
      }),
    ).toBeUndefined()
  })

  it.each(['AND', 'OR'] as const)('rejects a malformed %s group', (operator) => {
    expect(() =>
      buildPolymorphicJoinWhere({
        adapter,
        collection: 'articles',
        table: articlesTable,
        where: { [operator]: 'not-an-array' } as unknown as Where,
        wherePlan: new Map(),
      }),
    ).toThrow(operator)
  })
})

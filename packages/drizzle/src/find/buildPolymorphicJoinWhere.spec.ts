import type { Client } from '@libsql/client'
import type { FlattenedField, Where } from 'payload'

import { createClient } from '@libsql/client'
import { like, notLike } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { afterAll, describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter, DrizzleOperandTransformHandler } from '../types.js'
import type { PolymorphicJoinWherePlan } from './createPolymorphicJoinWherePlan.js'

import { operatorMap } from '../queries/operatorMap.js'
import { createJSONQuery } from '../sqlite/createJSONQuery/index.js'
import { buildPolymorphicJoinWhere } from './buildPolymorphicJoinWhere.js'

const articlesTable = sqliteTable('join_articles', {
  id: integer('id').primaryKey(),
  parent: integer('parent_id'),
  score: integer('score'),
  title: text('title'),
})

const notesTable = sqliteTable('join_notes', {
  id: integer('id').primaryKey(),
  parent: integer('parent_id'),
  title: text('title'),
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

const renderWhere = ({
  collection = 'articles',
  table = articlesTable,
  where,
  wherePlan,
}: {
  collection?: string
  table?: typeof articlesTable | typeof notesTable
  where: Where
  wherePlan: PolymorphicJoinWherePlan
}) => {
  const condition = buildPolymorphicJoinWhere({
    adapter,
    collection,
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

  it('treats a numeric like comparison as equality', () => {
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

  it('applies configured operator handlers to scalar comparisons', () => {
    const transformOperands = vi.fn(({ column, value }) => ({
      column,
      value: `handled-${String(value)}`,
    }))
    const handler: DrizzleOperandTransformHandler = {
      name: 'prefix-value',
      operators: ['equals'],
      transformOperands,
    }
    const adapterWithHandler = {
      ...adapter,
      operatorHandlers: [handler],
    } as DrizzleAdapter
    const condition = buildPolymorphicJoinWhere({
      adapter: adapterWithHandler,
      collection: 'articles',
      table: articlesTable,
      where: { title: { equals: 'available' } },
      wherePlan: scalarPlan({ columnPath: 'title' }),
    })
    const query = db.select({ id: articlesTable.id }).from(articlesTable).where(condition).toSQL()

    expect(transformOperands).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'title', resolvedOperator: 'equals', storage: 'column' }),
    )
    expect(query.params).toEqual(['handled-available'])
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

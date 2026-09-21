import type { Client } from '@libsql/client'
import type { SQL } from 'drizzle-orm'
import type { Field, FlattenedJoinField, Where } from 'payload'

import { createClient } from '@libsql/client'
import { getTableName, like, notLike } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { flattenAllFields } from 'payload'
import toSnakeCase from 'to-snake-case'
import { afterAll, describe, expect, it } from 'vitest'

import type { DrizzleAdapter, GenericTable } from '../types.js'

import { operatorMap } from '../queries/operatorMap.js'
import { createJSONQuery } from '../sqlite/createJSONQuery/index.js'
import { buildPolymorphicJoinQuery } from './buildPolymorphicJoinQuery.js'

const parentsTable = sqliteTable('join_parents', {
  id: integer('id').primaryKey(),
})

const articlesTable = sqliteTable('join_articles', {
  id: integer('id').primaryKey(),
  createdAt: text('created_at'),
  details_rank: integer('details_rank'),
  parent: integer('parent_id'),
  score: integer('score'),
  title: text('title'),
})

const notesTable = sqliteTable('join_notes', {
  id: integer('id').primaryKey(),
  parent: integer('parent_id'),
  title: text('title'),
})

const tableWithoutID = sqliteTable('join_without_id', {
  parent: integer('parent_id'),
})

const tableWithoutParent = sqliteTable('join_without_parent', {
  id: integer('id').primaryKey(),
})

const client: Client = createClient({ url: 'file::memory:' })
const db = drizzle(client, {
  schema: { articlesTable, notesTable, parentsTable, tableWithoutID, tableWithoutParent },
})

type CollectionFixture = {
  fields: Field[]
  table: GenericTable
}

const createAdapter = (fixtures: Record<string, CollectionFixture>): DrizzleAdapter => {
  const collections: Record<
    string,
    { config: { fields: Field[]; flattenedFields: ReturnType<typeof flattenAllFields> } }
  > = {}
  const tableNameMap = new Map<string, string>()
  const tables: Record<string, GenericTable> = {}

  for (const [slug, fixture] of Object.entries(fixtures)) {
    const tableName = getTableName(fixture.table)

    collections[slug] = {
      config: {
        fields: fixture.fields,
        flattenedFields: flattenAllFields({ fields: fixture.fields }),
      },
    }
    tableNameMap.set(toSnakeCase(slug), tableName)
    tables[tableName] = fixture.table
  }

  return {
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
    payload: { collections },
    tableNameMap,
    tables,
  } as unknown as DrizzleAdapter
}

const adapter = createAdapter({
  articles: {
    fields: [
      { name: 'createdAt', type: 'date' },
      {
        name: 'details',
        type: 'group',
        fields: [{ name: 'rank', type: 'number' }],
      },
      { name: 'parent', relationTo: 'join-parents', type: 'relationship' },
      { name: 'score', type: 'number' },
      { name: 'title', type: 'text' },
    ],
    table: articlesTable,
  },
  notes: {
    fields: [
      { name: 'parent', relationTo: 'join-parents', type: 'relationship' },
      { name: 'title', type: 'text' },
    ],
    table: notesTable,
  },
})

const joinField = {
  collection: ['articles', 'notes'],
  name: 'children',
  on: 'parent',
  type: 'join',
} as unknown as FlattenedJoinField

const buildQuery = ({
  adapter: adapterArg = adapter,
  field = joinField,
  limit = 0,
  page,
  path = '',
  shouldCount = false,
  sort,
  where,
}: {
  adapter?: DrizzleAdapter
  field?: FlattenedJoinField
  limit?: number
  page?: number
  path?: string
  shouldCount?: boolean
  sort?: string | string[]
  where?: Where
} = {}) =>
  buildPolymorphicJoinQuery({
    adapter: adapterArg,
    currentTableName: getTableName(parentsTable),
    field,
    limit,
    page,
    path,
    shouldCount,
    sort,
    where,
  })

const renderQuery = (query: ReturnType<typeof buildPolymorphicJoinQuery>) => {
  const selection: Record<string, SQL.Aliased> = { documents: query.documents }

  if (query.count) {
    selection.count = query.count
  }

  return db.select(selection).from(parentsTable).toSQL()
}

afterAll(() => client.close())

describe('buildPolymorphicJoinQuery', () => {
  it('combines every target into one fixed polymorphic document projection', () => {
    const result = buildQuery({ path: 'content.' })
    const query = renderQuery(result)

    expect(result.columnName).toBe('content_children')
    expect(result.count).toBeUndefined()
    expect(query.sql).toContain('union all')
    expect(query.sql).toContain('select "id"')
    expect(query.sql).toContain('from "join_articles" union all')
    expect(query.sql).toContain('from "join_notes"')
    expect(query.sql).toContain('as "parent"')
    expect(query.sql).toContain('as "relationTo"')
    expect(query.sql).toContain("json_object('id',")
    expect(query.sql).toContain("'relationTo',")
    expect(query.params).toContain('articles')
    expect(query.params).toContain('notes')
  })

  it('sorts by createdAt descending by default when one target has timestamps', () => {
    const query = renderQuery(buildQuery())

    expect(query.sql).toContain('"created_at" as "sortPath" from "join_articles"')
    expect(query.sql).toContain('? as "sortPath" from "join_notes"')
    expect(query.sql).toContain('order by "sortPath" desc')
    expect(query.params).toContain(null)
  })

  it('uses id ascending by default when no target has a createdAt field', () => {
    const adapterWithoutTimestamps = createAdapter({
      articles: {
        fields: [{ name: 'parent', relationTo: 'join-parents', type: 'relationship' }],
        table: articlesTable,
      },
      notes: {
        fields: [{ name: 'parent', relationTo: 'join-parents', type: 'relationship' }],
        table: notesTable,
      },
    })
    const query = renderQuery(buildQuery({ adapter: adapterWithoutTimestamps }))

    expect(query.sql).toContain('"id" as "sortPath" from "join_articles"')
    expect(query.sql).toContain('"id" as "sortPath" from "join_notes"')
    expect(query.sql).toContain('order by "sortPath" asc')
  })

  it('supports an explicit ascending nested sort and substitutes null when it is absent', () => {
    const query = renderQuery(buildQuery({ sort: 'details.rank' }))

    expect(query.sql).toContain('"details_rank" as "sortPath" from "join_articles"')
    expect(query.sql).toContain('? as "sortPath" from "join_notes"')
    expect(query.sql).toContain('order by "sortPath" asc')
    expect(query.params).toContain(null)
  })

  it('applies the shared where clause independently to each target branch', () => {
    const query = renderQuery(
      buildQuery({
        where: {
          AND: [{ title: { equals: 'available' } }, { relationTo: { equals: 'articles' } }],
        },
      }),
    )

    expect(query.sql.match(/"title" = \?/g)).toHaveLength(2)
    expect(query.sql).toContain('? = ?')
    expect(query.params.filter((value) => value === 'available')).toHaveLength(2)
    expect(query.params).toContain('articles')
    expect(query.params).toContain('notes')
  })

  it('adds a correlated count only when requested', () => {
    const result = buildQuery({ shouldCount: true })
    const query = renderQuery(result)

    expect(result.count).toBeDefined()
    expect(query.sql).toContain('select count(*) from')
    expect(query.sql).toContain('"join_parents"."id" = "children_subquery"."parent"')
  })

  it('adds limit and page offset to the document query', () => {
    const query = renderQuery(buildQuery({ limit: 11, page: 3 }))

    expect(query.sql).toContain('LIMIT ? OFFSET ?')
    expect(query.params.slice(-2)).toEqual([11, 22])
  })

  it('does not add limit or offset when limit is zero', () => {
    const query = renderQuery(buildQuery({ limit: 0, page: 3 }))
    const normalizedSQL = query.sql.toLowerCase()

    expect(normalizedSQL).not.toContain(' limit ')
    expect(normalizedSQL).not.toContain(' offset ')
  })

  it('rejects a join field with a non-polymorphic collection', () => {
    const scalarJoinField = {
      ...joinField,
      collection: 'articles',
    } as unknown as FlattenedJoinField

    expect(() => buildQuery({ field: scalarJoinField })).toThrow(
      'A polymorphic join requires a collection array',
    )
  })

  it('rejects a polymorphic join with no target collections', () => {
    const emptyJoinField = { ...joinField, collection: [] } as unknown as FlattenedJoinField

    expect(() => buildQuery({ field: emptyJoinField })).toThrow(
      'A polymorphic join requires at least one collection',
    )
  })

  it('rejects multiple sort fields with a descriptive error', () => {
    expect(() => buildQuery({ sort: ['title', '-createdAt'] })).toThrow(
      'Polymorphic joins do not support multiple sort fields',
    )
  })

  it('throws a descriptive error when a target collection is not configured', () => {
    const missingCollectionField = {
      ...joinField,
      collection: ['articles', 'missing'],
    } as unknown as FlattenedJoinField

    expect(() => buildQuery({ field: missingCollectionField })).toThrow(
      'Unknown polymorphic join collection "missing"',
    )
  })

  it('throws a descriptive error when a configured collection has no database table', () => {
    const adapterWithoutTable = createAdapter({
      articles: {
        fields: [{ name: 'parent', relationTo: 'join-parents', type: 'relationship' }],
        table: articlesTable,
      },
    })

    adapterWithoutTable.tables = {}

    const singleCollectionField = {
      ...joinField,
      collection: ['articles'],
    } as unknown as FlattenedJoinField

    expect(() =>
      buildQuery({ adapter: adapterWithoutTable, field: singleCollectionField }),
    ).toThrow('Polymorphic join collection "articles" has no database table')
  })

  it.each([
    [
      'id',
      createAdapter({
        articles: {
          fields: [{ name: 'parent', relationTo: 'join-parents', type: 'relationship' }],
          table: tableWithoutID,
        },
      }),
    ],
    [
      'parent',
      createAdapter({
        articles: {
          fields: [{ name: 'parent', relationTo: 'join-parents', type: 'relationship' }],
          table: tableWithoutParent,
        },
      }),
    ],
  ] as const)('rejects a target whose table has no %s column', (column, adapterArg) => {
    const singleCollectionField = {
      ...joinField,
      collection: ['articles'],
    } as unknown as FlattenedJoinField

    expect(() => buildQuery({ adapter: adapterArg, field: singleCollectionField })).toThrow(
      `Polymorphic join collection "articles" has no "${column}" column`,
    )
  })
})

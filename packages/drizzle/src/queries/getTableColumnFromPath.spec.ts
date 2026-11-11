import type { Client } from '@libsql/client'
import type { FlattenedField } from 'payload'

import { createClient } from '@libsql/client'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { afterAll, describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

import { getTableColumnFromPath } from './getTableColumnFromPath.js'

const chainedTable = sqliteTable('chained', {
  id: text('id').primaryKey(),
  name: text('name'),
  relation: text('relation_id'),
})
const chainedRelationshipsTable = sqliteTable('chained_rels', {
  chainedID: text('chained_id'),
  parent: text('parent_id'),
  path: text('path'),
})
const fields = [
  { name: 'name', type: 'text' },
  { name: 'relation', relationTo: 'chained', type: 'relationship' },
] as FlattenedField[]
const hasManyFields = [
  { name: 'name', type: 'text' },
  { hasMany: true, name: 'relation', relationTo: 'chained', type: 'relationship' },
] as FlattenedField[]
const adapter = {
  idType: 'uuid',
  name: 'sqlite',
  payload: {
    collections: {
      chained: {
        config: {
          flattenedFields: fields,
          slug: 'chained',
        },
      },
    },
    config: {},
  },
  relationshipsSuffix: '_rels',
  tableNameMap: new Map([['chained', 'chained']]),
  tables: { chained: chainedTable },
} as unknown as DrizzleAdapter
const hasManyAdapter = {
  ...adapter,
  payload: {
    collections: {
      chained: {
        config: {
          flattenedFields: hasManyFields,
          slug: 'chained',
        },
      },
    },
    config: {},
  },
  tables: { chained: chainedTable, chained_rels: chainedRelationshipsTable },
} as unknown as DrizzleAdapter
const client: Client = createClient({ url: 'file::memory:' })
const db = drizzle(client)

afterAll(() => client.close())

describe('getTableColumnFromPath', () => {
  it('should join each level when a relationship field name repeats', () => {
    const joins: BuildQueryJoinAliases = []
    const result = getTableColumnFromPath({
      adapter,
      collectionPath: 'relation.relation.name',
      fields,
      joins,
      parentIsLocalized: false,
      pathSegments: ['relation', 'relation', 'name'],
      selectFields: {},
      tableName: 'chained',
      value: 'third',
    })
    let query = db.select({ id: chainedTable.id }).from(chainedTable).$dynamic()

    for (const join of joins) {
      query = query.leftJoin(join.table, join.condition)
    }

    const renderedQuery = query.where(eq(result.table[result.columnName], 'third')).toSQL()

    expect(renderedQuery.sql).toMatch(
      /^select "chained"\."id" from "chained" left join "chained" "([^"]+)" on "\1"\."id" = "chained"\."relation_id" left join "chained" "([^"]+)" on "\2"\."id" = "\1"\."relation_id" where "\2"\."name" = \?$/,
    )
    expect(renderedQuery.params).toEqual(['third'])
  })

  it('should join each relationship table when a has-many relationship field name repeats', () => {
    const joins: BuildQueryJoinAliases = []
    const result = getTableColumnFromPath({
      adapter: hasManyAdapter,
      collectionPath: 'relation.relation.name',
      fields: hasManyFields,
      joins,
      parentIsLocalized: false,
      pathSegments: ['relation', 'relation', 'name'],
      selectFields: {},
      tableName: 'chained',
      value: 'third',
    })
    let query = db.select({ id: chainedTable.id }).from(chainedTable).$dynamic()

    for (const join of joins) {
      query = query.leftJoin(join.table, join.condition)
    }

    const renderedQuery = query.where(eq(result.table[result.columnName], 'third')).toSQL()

    expect(renderedQuery.sql).toMatch(
      /^select "chained"\."id" from "chained" left join "chained_rels" "([^"]+)" on \("chained"\."id" = "\1"\."parent_id" and "\1"\."path" like \?\) left join "chained" "([^"]+)" on "\2"\."id" = "\1"\."chained_id" left join "chained_rels" "([^"]+)" on \("\2"\."id" = "\3"\."parent_id" and "\3"\."path" like \?\) left join "chained" "([^"]+)" on "\4"\."id" = "\3"\."chained_id" where "\4"\."name" = \?$/,
    )
    expect(renderedQuery.params).toEqual(['relation', 'relation', 'third'])
  })
})

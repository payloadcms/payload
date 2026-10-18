import type { SQL } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { SQLiteSelect } from 'drizzle-orm/sqlite-core'

import { asc, count, desc, eq, sql } from 'drizzle-orm'
import { type FlattenedJoinField, type Where } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, GenericTable } from '../types.js'
import type { PolymorphicJoinWherePlan } from './createPolymorphicJoinWherePlan.js'

import { jsonAggBuildObject } from '../utilities/json.js'
import { buildPolymorphicJoinWhere } from './buildPolymorphicJoinWhere.js'
import { createPolymorphicJoinWherePlan } from './createPolymorphicJoinWherePlan.js'

type BuildPolymorphicJoinQueryArgs = {
  adapter: DrizzleAdapter
  currentTableName: string
  field: FlattenedJoinField
  limit: number
  page?: number
  path: string
  shouldCount: boolean
  sort?: string | string[]
  where?: Where
}

type PolymorphicJoinQuery = {
  columnName: string
  count?: SQL.Aliased
  documents: SQL.Aliased
}

/**
 * Builds the correlated document and optional count projections for a join that targets multiple
 * collections. Every collection branch exposes the same `id`, parent, `relationTo`, and sort
 * columns before the branches are combined. A missing sort field resolves to SQL NULL so targets
 * with different schemas can still share one ordered union.
 *
 * `field.collection` must contain at least one configured collection. Each mapped table must have
 * an `id` column and the column named by `field.on`. The supplied `limit` is used as-is; callers can
 * include an extra look-ahead row when they calculate pagination.
 *
 * @returns The stable projection name, the document projection, and the count projection when
 * `shouldCount` is true.
 * @throws If the join definition, target collection, mapped table, required columns, or sort shape
 * cannot be represented by the polymorphic query.
 */
export const buildPolymorphicJoinQuery = ({
  adapter,
  currentTableName,
  field,
  limit,
  page,
  path,
  shouldCount,
  sort,
  where,
}: BuildPolymorphicJoinQueryArgs): PolymorphicJoinQuery => {
  if (!Array.isArray(field.collection)) {
    throw new Error('A polymorphic join requires a collection array')
  }

  if (field.collection.length === 0) {
    throw new Error('A polymorphic join requires at least one collection')
  }

  if (Array.isArray(sort)) {
    throw new Error('Polymorphic joins do not support multiple sort fields')
  }

  const collections = field.collection
  const columnName = `${path.replaceAll('.', '_')}${field.name}`
  const db = adapter.drizzle as LibSQLDatabase
  const onPath = field.on.split('.').join('_')
  const collectionTables = collections.map((collection) => {
    if (!adapter.payload.collections[collection]) {
      throw new Error(`Unknown polymorphic join collection "${collection}"`)
    }

    const tableName = adapter.tableNameMap.get(toSnakeCase(collection))
    const table = tableName ? (adapter.tables[tableName] as GenericTable | undefined) : undefined

    if (!table) {
      throw new Error(`Polymorphic join collection "${collection}" has no database table`)
    }

    if (!table['id']) {
      throw new Error(`Polymorphic join collection "${collection}" has no "id" column`)
    }

    if (!table[onPath]) {
      throw new Error(`Polymorphic join collection "${collection}" has no "${onPath}" column`)
    }

    return { collection, table }
  })
  const sortField = getSortField({ adapter, collections, sort })
  const sortOrder = sortField.startsWith('-') ? desc : asc
  const sortPath = sortField.replace('-', '').split('.').join('_')
  const wherePlan: PolymorphicJoinWherePlan = where
    ? createPolymorphicJoinWherePlan({ adapter, collections, where })
    : new Map()
  let unionQuery: null | SQLiteSelect = null

  for (const { collection, table } of collectionTables) {
    const sortColumn = table[sortPath]
    const selectFields = {
      id: table['id'],
      parent: sql`${table[onPath]}`.as(onPath),
      relationTo: sql`${collection}`.as('relationTo'),
      sortPath: sql`${sortColumn ?? null}`.as('sortPath'),
    }
    const collectionWhere =
      where && Object.keys(where).length > 0
        ? buildPolymorphicJoinWhere({
            adapter,
            collection,
            table,
            where,
            wherePlan,
          })
        : undefined
    let collectionQuery = db.select(selectFields).from(table).$dynamic()

    if (collectionWhere) {
      collectionQuery = collectionQuery.where(collectionWhere)
    }

    if (unionQuery === null) {
      unionQuery = collectionQuery as unknown as SQLiteSelect
    } else {
      unionQuery = unionQuery.unionAll(collectionQuery)
    }
  }

  const subQueryAlias = `${columnName}_subquery`
  const parentConstraint = eq(
    sql.raw(`"${currentTableName}"."id"`),
    sql.raw(`"${subQueryAlias}"."${onPath}"`),
  )
  const countExpression = shouldCount
    ? sql`${db
        .select({ count: count() })
        .from(sql`${unionQuery.as(subQueryAlias)}`)
        .where(parentConstraint)}`.as(`${columnName}_count`)
    : undefined

  unionQuery = unionQuery.orderBy(sortOrder(sql`"sortPath"`))

  const sortedUnionAlias = `${columnName}_sorted`
  let limitOffsetSQL = sql.empty()

  if (limit) {
    limitOffsetSQL = sql` LIMIT ${limit}`
  }

  if (page && limit !== 0) {
    const offset = (page - 1) * limit

    if (offset > 0) {
      limitOffsetSQL = sql`${limitOffsetSQL} OFFSET ${offset}`
    }
  }

  const parentWhere = sql.raw(`"${sortedUnionAlias}"."${onPath}" = "${currentTableName}"."id"`)
  const documents = sql`(
    SELECT ${jsonAggBuildObject(adapter, {
      id: sql.raw(`"${subQueryAlias}"."id"`),
      relationTo: sql.raw(`"${subQueryAlias}"."relationTo"`),
    })}
    FROM (
      SELECT * FROM ${sql`${unionQuery.as(sortedUnionAlias)}`}
      WHERE ${parentWhere}${limitOffsetSQL}
    ) AS ${sql.raw(`"${subQueryAlias}"`)}
  )`.as(columnName)

  return {
    columnName,
    count: countExpression,
    documents,
  }
}

const getSortField = ({
  adapter,
  collections,
  sort,
}: {
  adapter: DrizzleAdapter
  collections: string[]
  sort?: string
}): string => {
  if (sort) {
    return sort
  }

  const hasCreatedAt = collections.some((collection) =>
    adapter.payload.collections[collection].config.fields.some(
      (field) => field.type === 'date' && field.name === 'createdAt',
    ),
  )

  return hasCreatedAt ? '-createdAt' : 'id'
}

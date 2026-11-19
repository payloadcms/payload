import type { SQL } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { SQLiteSelect } from 'drizzle-orm/sqlite-core'

import { and, asc, count, desc, eq, getTableName, sql } from 'drizzle-orm'
import { type FlattenedJoinField, QueryError, type Where } from 'payload'
import { getFieldInGroups, hasRowContains, scopePolymorphicJoinWhere } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { BuildQueryJoinAliases } from '../queries/buildQuery.js'
import type { DrizzleAdapter, GenericTable } from '../types.js'
import type { PolymorphicJoinWherePlan } from './createPolymorphicJoinWherePlan.js'

import { addJoinTable } from '../queries/addJoinTable.js'
import { jsonAggBuildObject } from '../utilities/json.js'
import { buildPolymorphicJoinWhere } from './buildPolymorphicJoinWhere.js'
import { createPolymorphicJoinWherePlan } from './createPolymorphicJoinWherePlan.js'

type BuildPolymorphicJoinQueryArgs = {
  adapter: DrizzleAdapter
  currentTableName: string
  field: FlattenedJoinField
  limit: number
  locale?: string
  page?: number
  pageSize?: number
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
 * include an extra look-ahead row and supply the original `pageSize` for offset calculation.
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
  locale,
  page,
  pageSize = limit,
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
  const rowPaths = [...wherePlan.values()].filter(({ fieldsByCollection }) =>
    [...fieldsByCollection.values()].some(({ type }) => type === 'rowContains'),
  )
  const conflictingRowPaths = rowPaths
    .filter(({ type }) => type === 'invalid')
    .map(({ schemaPath }) => schemaPath)
  let unionQuery: null | SQLiteSelect = null

  for (const { collection, table } of collectionTables) {
    const sortColumn = table[sortPath]
    const selectFields = {
      id: table['id'],
      parent: sql`${table[onPath]}`.as(onPath),
      relationTo: sql`${collection}`.as('relationTo'),
      sortPath: sql`${sortColumn ?? null}`.as('sortPath'),
    }
    const joins: BuildQueryJoinAliases = []
    const scopedWhere =
      where && rowPaths.length
        ? scopePolymorphicJoinWhere({ collectionSlug: collection, where })
        : where

    let collectionPlan = wherePlan
    let collectionWhere: SQL | undefined

    if (scopedWhere === false) {
      collectionWhere = sql`false`
    } else if (scopedWhere && scopedWhere !== true && Object.keys(scopedWhere).length > 0) {
      if (conflictingRowPaths.length) {
        collectionPlan = replanConflictingRowPaths({
          adapter,
          collection,
          conflictingRowPaths,
          where: scopedWhere,
          wherePlan,
        })
      }

      collectionWhere = buildPolymorphicJoinWhere({
        adapter,
        collection,
        joins,
        locale,
        table,
        where: scopedWhere,
        wherePlan: collectionPlan,
      })
    }
    const hasLocalizedWhere = [...collectionPlan.values()].some((pathPlan) => {
      const collectionField = pathPlan.fieldsByCollection.get(collection)

      return collectionField?.type === 'scalar' && collectionField.isLocalized
    })
    const shouldDeduplicate =
      joins.length > 0 || (hasLocalizedWhere && (!locale || locale === 'all'))

    if (hasLocalizedWhere) {
      const localesTable = adapter.tables[`${getTableName(table)}${adapter.localesSuffix}`]

      addJoinTable({
        condition: and(
          eq(table['id'], localesTable._parentID),
          locale && locale !== 'all' ? eq(localesTable._locale, locale) : undefined,
        ),
        joins,
        table: localesTable,
      })
    }

    let collectionQuery = (
      shouldDeduplicate ? db.selectDistinct(selectFields) : db.select(selectFields)
    )
      .from(table)
      .$dynamic()

    for (const { type, condition, table: joinedTable } of joins) {
      collectionQuery = collectionQuery[type ?? 'leftJoin'](joinedTable, condition)
    }

    if (collectionWhere) {
      collectionQuery = collectionQuery.where(collectionWhere)
    }

    if (unionQuery === null) {
      unionQuery = collectionQuery
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
    const offset = (page - 1) * pageSize

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

function replanConflictingRowPaths({
  adapter,
  collection,
  conflictingRowPaths,
  where,
  wherePlan,
}: {
  adapter: DrizzleAdapter
  collection: string
  conflictingRowPaths: string[]
  where: Where
  wherePlan: PolymorphicJoinWherePlan
}): PolymorphicJoinWherePlan {
  const localPlan = createPolymorphicJoinWherePlan({ adapter, collections: [collection], where })
  const collectionPlan = new Map(wherePlan)
  const { flattenedFields } = adapter.payload.collections[collection]!.config

  for (const path of conflictingRowPaths) {
    const localPath = localPlan.get(path)
    if (!localPath) {
      continue
    }

    if (
      localPath.type === 'rowContains' ||
      !hasRowContains({ isRowField: (candidate) => candidate === path, where })
    ) {
      collectionPlan.set(path, localPath)
      continue
    }

    if (getFieldInGroups({ fields: flattenedFields, path })) {
      throw new QueryError([{ path: `${path}.contains` }])
    }

    collectionPlan.set(path, { ...localPath, type: 'rowContains' })
  }

  return collectionPlan
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

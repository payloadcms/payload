import type { SQL } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { SQLiteSelect } from 'drizzle-orm/sqlite-core'
import type { FlattenedJoinField, Where } from 'payload'

import { and, asc, count, desc, eq, getTableName, sql } from 'drizzle-orm'
import { getFieldByPath } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, GenericTable } from '../types.js'
import type { PolymorphicJoinWherePlan } from './createPolymorphicJoinWherePlan.js'

import { resolveRelationshipPath } from '../queries/resolveRelationshipPath.js'
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
  parentCollectionSlug?: string
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
 * an `id` column and either a direct relationship column or a matching relationship table. The
 * supplied `limit` can include a look-ahead row. `pageSize` controls the offset.
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
  parentCollectionSlug,
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
    const target = adapter.payload.collections[collection]

    if (!target) {
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

    const fields = target.config.flattenedFields
    const membership = getFieldByPath({ fields, path: field.on })?.field

    if (
      membership?.type === 'relationship' &&
      membership.hasMany &&
      typeof membership.relationTo === 'string'
    ) {
      const relationshipTable = adapter.tables[`${tableName}${adapter.relationshipsSuffix}`]
      const relationshipPath = resolveRelationshipPath({
        adapter,
        fields,
        locale,
        parentIsLocalized: false,
        path: field.on,
      })
      const parentColumn = relationshipTable?.[`${membership.relationTo}ID`]

      if (
        !relationshipTable ||
        !relationshipPath ||
        relationshipPath.path !== field.on ||
        !parentColumn ||
        (parentCollectionSlug && membership.relationTo !== parentCollectionSlug)
      ) {
        throw new Error(
          `Polymorphic join collection "${collection}" has no supported relationship at "${field.on}"`,
        )
      }

      const relationshipLocale = relationshipPath.locale
      const membershipCondition = and(
        eq(table['id'], relationshipTable.parent),
        eq(relationshipTable.path, relationshipPath.path),
        relationshipPath.isLocalized && relationshipLocale && relationshipLocale !== 'all'
          ? eq(relationshipTable.locale, relationshipLocale)
          : undefined,
      )

      return { collection, membershipCondition, parentColumn, relationshipTable, table }
    }

    const parentColumn = table[onPath]
    if (!parentColumn) {
      throw new Error(`Polymorphic join collection "${collection}" has no "${onPath}" column`)
    }

    return { collection, parentColumn, table }
  })
  const sortField = getSortField({ adapter, collections, sort })
  const sortOrder = sortField.startsWith('-') ? desc : asc
  const sortPath = sortField.replace('-', '').split('.').join('_')
  const wherePlan: PolymorphicJoinWherePlan = where
    ? createPolymorphicJoinWherePlan({ adapter, collections, where })
    : new Map()
  let unionQuery: null | SQLiteSelect = null

  for (const {
    collection,
    membershipCondition,
    parentColumn,
    relationshipTable,
    table,
  } of collectionTables) {
    const sortColumn = table[sortPath]
    const selectFields = {
      id: table['id'],
      parent: sql`${parentColumn}`.as('parent'),
      relationTo: sql`${collection}`.as('relationTo'),
      sortPath: sql`${sortColumn ?? null}`.as('sortPath'),
    }
    const collectionWhere =
      where && Object.keys(where).length > 0
        ? buildPolymorphicJoinWhere({
            adapter,
            collection,
            locale,
            table,
            where,
            wherePlan,
          })
        : undefined
    const hasLocalizedWhere = [...wherePlan.values()].some((pathPlan) => {
      const collectionField = pathPlan.fieldsByCollection.get(collection)

      return collectionField?.type === 'scalar' && collectionField.isLocalized
    })
    const shouldDeduplicate =
      Boolean(relationshipTable) || (hasLocalizedWhere && (!locale || locale === 'all'))
    let collectionQuery = (
      shouldDeduplicate ? db.selectDistinct(selectFields) : db.select(selectFields)
    )
      .from(table)
      .$dynamic()

    if (relationshipTable) {
      collectionQuery = collectionQuery.innerJoin(relationshipTable, membershipCondition)
    }

    if (hasLocalizedWhere) {
      const localesTable = adapter.tables[`${getTableName(table)}${adapter.localesSuffix}`]

      collectionQuery = collectionQuery.leftJoin(
        localesTable,
        and(
          eq(table['id'], localesTable._parentID),
          locale && locale !== 'all' ? eq(localesTable._locale, locale) : undefined,
        ),
      )
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
  const parentID = sql`${sql.identifier(currentTableName)}."id"`
  const parentConstraint = eq(parentID, sql`${sql.identifier(subQueryAlias)}."parent"`)
  const countExpression = shouldCount
    ? sql`${db
        .select({ count: count() })
        .from(sql`${unionQuery.as(subQueryAlias)}`)
        .where(parentConstraint)}`.as(`${columnName}_count`)
    : undefined

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

  const parentWhere = eq(sql`${sql.identifier(sortedUnionAlias)}."parent"`, parentID)
  const documents = sql`(
    SELECT ${jsonAggBuildObject(adapter, {
      id: sql.raw(`"${subQueryAlias}"."id"`),
      relationTo: sql.raw(`"${subQueryAlias}"."relationTo"`),
    })}
    FROM (
      SELECT * FROM ${sql`${unionQuery.as(sortedUnionAlias)}`}
      WHERE ${parentWhere}
      order by ${sortOrder(sql`"sortPath"`)}, ${asc(sql`"relationTo"`)}, ${asc(sql`"id"`)}${limitOffsetSQL}
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

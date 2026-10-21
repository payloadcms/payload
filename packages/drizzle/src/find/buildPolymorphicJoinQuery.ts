import type { SQL } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { SQLiteSelect } from 'drizzle-orm/sqlite-core'

import { and, asc, count, desc, eq, max, min, sql } from 'drizzle-orm'
import {
  type BranchProjectionQueryContext,
  type FlattenedJoinField,
  getFieldByPath,
  type Where,
} from 'payload'

import type { DrizzleAdapter, GenericTable } from '../types.js'
import type { PolymorphicJoinWherePlan } from './createPolymorphicJoinWherePlan.js'

import {
  getProjectionCollection,
  getProjectionTarget,
  projectionRelationConstraint,
} from '../branching/projectionConstraints.js'
import { buildQuery } from '../queries/buildQuery.js'
import { getTableAlias } from '../queries/getTableAlias.js'
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
  preparedOptions?: NonNullable<BranchProjectionQueryContext['joins']>[string]
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
  preparedOptions,
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
  const rootSlug = getProjectionCollection({ adapter, table: adapter.tables[currentTableName] })
  const rootCollection = rootSlug ? adapter.payload.collections[rootSlug]?.config : undefined
  const rootID = sql.raw(`"${currentTableName}"."id"`)
  const rootLogicalID = rootCollection?.custom?.branchProjectionStorage
    ? sql.raw(
        `"${currentTableName}"."${adapter.tables[currentTableName]['_branchProjection_logicalID'].name}"`,
      )
    : rootID
  const onPath = field.on.split('.').join('_')
  const collectionTables = collections.map((collection) => {
    if (!adapter.payload.collections[collection]) {
      throw new Error(`Unknown polymorphic join collection "${collection}"`)
    }

    const target = getProjectionTarget({ adapter, collection })
    const tableName = target.tableName
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

    return {
      collection,
      table: preparedOptions ? getTableAlias({ adapter, tableName }).newAliasTable : table,
      target,
    }
  })
  const sortField =
    preparedOptions?.[collections[0]]?.sort[0] ?? getSortField({ adapter, collections, sort })
  const sortOrder = sortField.startsWith('-') ? desc : asc
  const preparedSort = preparedOptions?.[collections[0]]?.sort
  const sortTerms = preparedSort?.map((sort, index) => ({
    index,
    isLogicalID: collectionTables.every(({ collection }) =>
      ['_branchProjection.logicalID', 'id'].includes(
        preparedOptions[collection]?.sort[index]?.replace(/^-/, ''),
      ),
    ),
    order: sort.startsWith('-') ? desc : asc,
  }))
  const preparedSortColumns = new Map(
    collectionTables.map(({ collection, table, target }) => [
      collection,
      (sortTerms ?? []).map(({ index, isLogicalID }) =>
        isLogicalID
          ? []
          : buildProjectionJoinSortColumns({
              adapter,
              collection: target.collection,
              locale,
              sort: preparedOptions[collection].sort[index],
              table,
              tableName: target.tableName,
            }),
      ),
    ]),
  )
  const sortWidths = (sortTerms ?? []).map(({ index }) =>
    Math.max(
      1,
      ...collectionTables.map(
        ({ collection }) => preparedSortColumns.get(collection)[index].length,
      ),
    ),
  )
  const wherePlan: PolymorphicJoinWherePlan = where
    ? createPolymorphicJoinWherePlan({ adapter, collections, where })
    : new Map()
  let unionQuery: null | SQLiteSelect = null

  for (const { collection, table, target } of collectionTables) {
    const targetOptions = preparedOptions?.[collection]
    const targetWhere = targetOptions?.where ?? where
    const targetWherePlan =
      targetWhere && targetOptions
        ? createPolymorphicJoinWherePlan({ adapter, collections, where: targetWhere })
        : wherePlan
    const targetSort = targetOptions?.sort[0] ?? sortField
    const targetSortPath = targetSort.replace(/^-/, '').split('.').join('_')
    const logicalIDColumn =
      table[target.config.custom?.branchProjectionStorage ? '_branchProjection_logicalID' : 'id']
    const idField = getFieldByPath({
      fields: target.config.flattenedFields,
      path: target.config.custom?.branchProjectionStorage ? '_branchProjection.logicalID' : 'id',
    })?.field
    const isNumericID = idField?.type === 'number' || (!idField && adapter.idType === 'serial')
    const sortColumn =
      targetSortPath === 'id' && target.config.custom?.branchProjectionStorage
        ? table['_branchProjection_logicalID']
        : table[targetSortPath]
    const selectFields = {
      id:
        getProjectionCollection({ adapter, table }) && target.config.custom?.branchProjectionStorage
          ? (adapter.name === 'postgres'
              ? sql`to_jsonb(${logicalIDColumn})`
              : sql`${logicalIDColumn}`
            ).as('id')
          : preparedOptions && adapter.name === 'postgres'
            ? sql`to_jsonb(${logicalIDColumn})`.as('id')
            : table['id'],
      parent: preparedOptions ? sql`${rootID}`.as(onPath) : sql`${table[onPath]}`.as(onPath),
      relationTo: sql`${collection}`.as('relationTo'),
      sortPath: sql`${preparedOptions ? null : (sortColumn ?? null)}`.as('sortPath'),
      ...Object.fromEntries(
        (sortTerms ?? []).flatMap(({ index }) =>
          Array.from({ length: sortWidths[index] }, (_, component) => [
            `sortPath${index}_${component}`,
            sql`${preparedSortColumns.get(collection)[index][component] ?? null}`.as(
              `sortPath${index}_${component}`,
            ),
          ]),
        ),
      ),
      ...(preparedOptions
        ? {
            collectionTie:
              sql`${target.config.custom?.branchProjectionStorage?.collection ?? collection}`.as(
                'collectionTie',
              ),
            idDomain: sql`${isNumericID ? 0 : 1}`.as('idDomain'),
            idNumber: sql`${isNumericID ? logicalIDColumn : null}`.as('idNumber'),
            idText: sql`${isNumericID ? null : logicalIDColumn}`.as('idText'),
          }
        : {}),
    }
    const incomingCollectionWhere =
      targetWhere && Object.keys(targetWhere).length > 0
        ? buildPolymorphicJoinWhere({
            adapter,
            collection,
            locale,
            table,
            where: targetWhere,
            wherePlan: targetWherePlan,
          })
        : undefined
    const collectionWhere = and(
      incomingCollectionWhere,
      preparedOptions
        ? eq(table[onPath], target.config.custom?.branchProjectionStorage ? rootID : rootLogicalID)
        : undefined,
      projectionRelationConstraint({
        adapter,
        collection: target.collection,
        idColumn: table['id'],
        locale,
      }),
    )
    const hasLocalizedWhere = [...targetWherePlan.values()].some((pathPlan) => {
      const collectionField = pathPlan.fieldsByCollection.get(collection)

      return collectionField?.type === 'scalar' && collectionField.isLocalized
    })
    const shouldDeduplicate = hasLocalizedWhere && (!locale || locale === 'all')
    let collectionQuery = (
      shouldDeduplicate ? db.selectDistinct(selectFields) : db.select(selectFields)
    )
      .from(table)
      .$dynamic()

    if (hasLocalizedWhere) {
      const localesTable = adapter.tables[`${target.tableName}${adapter.localesSuffix}`]

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

  unionQuery = unionQuery.orderBy(
    ...(sortTerms
      ? [
          ...sortTerms.flatMap(({ index, isLogicalID, order }) =>
            isLogicalID
              ? [order(sql`"idDomain"`), order(sql`"idNumber"`), order(sql`"idText"`)]
              : Array.from({ length: sortWidths[index] }, (_, component) =>
                  order(sql.identifier(`sortPath${index}_${component}`)),
                ),
          ),
          asc(sql`"idDomain"`),
          asc(sql`"idNumber"`),
          asc(sql`"idText"`),
          asc(sql`"collectionTie"`),
        ]
      : [sortOrder(sql`"sortPath"`)]),
  )

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

/** Keep every prepared union sort term inside the same correlated native statement. */
const buildProjectionJoinSortColumns = ({
  adapter,
  collection,
  locale,
  sort,
  table,
  tableName,
}: {
  adapter: DrizzleAdapter
  collection: string
  locale?: string
  sort: string
  table: GenericTable
  tableName: string
}): SQL[] => {
  const path = sort.replace(/^-/, '')
  const config = adapter.payload.collections[collection].config
  if (!config.flattenedFields.some(({ name }) => name === path.split('.')[0])) {
    return []
  }
  const directColumn = table[path.replaceAll('.', '_')]
  if (directColumn) {
    return [sql`${directColumn}`]
  }
  const { newAliasTable } = getTableAlias({ adapter, tableName })
  const sortAdapter = Object.assign(Object.create(adapter), {
    tables: { ...adapter.tables, [tableName]: newAliasTable },
  }) as DrizzleAdapter
  const { joins, orderBy, where } = buildQuery({
    adapter: sortAdapter,
    aliasTable: newAliasTable,
    fields: config.flattenedFields,
    locale,
    sort: [sort, adapter.tables[tableName].createdAt ? '-createdAt' : '-id'],
    tableName,
    where: {},
  })
  // buildOrderBy appends the ordinary fallback. The union supplies its own logical ties.
  return orderBy.slice(0, -1).map((component) => {
    const value =
      component.projectionAggregate ?? (sort.startsWith('-') ? max : min)(component.column)
    let query = (adapter.drizzle as LibSQLDatabase)
      .select({ value })
      .from(newAliasTable)
      .where(and(eq(newAliasTable['id'], table['id']), where))
      .$dynamic()
    for (const join of joins) {
      query = query[join.type ?? 'leftJoin'](join.table, join.condition)
    }
    return sql`(${query})`
  })
}

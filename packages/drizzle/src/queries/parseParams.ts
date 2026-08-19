import type { SQL, Table } from 'drizzle-orm'
import type { FlattenedField, HasManyRelationshipOperator, Operator, Sort, Where } from 'payload'

import {
  aliasedTable,
  and,
  eq,
  exists,
  getTableName,
  isNotNull,
  isNull,
  like,
  notExists,
  notInArray,
  or,
  sql,
} from 'drizzle-orm'
import { PgUUID } from 'drizzle-orm/pg-core'
import { APIError, QueryError } from 'payload'
import { hasManyRelationshipOperatorSet, validOperatorSet } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, GenericColumn } from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'
import type { DrizzleResolvedOperator } from './operatorMap.js'

import { escapeSQLValue } from '../utilities/escapeSQLValue.js'
import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js'
import { isValidStringID } from '../utilities/isValidStringID.js'
import { DistinctSymbol } from '../utilities/rawConstraint.js'
import { buildAndOrConditions } from './buildAndOrConditions.js'
import { buildOperatorConstraint } from './buildOperatorConstraint.js'
import { getTableAlias } from './getTableAlias.js'
import { getTableColumnFromPath } from './getTableColumnFromPath.js'
import { resolveRelationshipPath } from './resolveRelationshipPath.js'
import { sanitizeQueryValue } from './sanitizeQueryValue.js'

export type QueryContext = { rawSort?: SQL; sort: Sort }

type Args = {
  adapter: DrizzleAdapter
  aliasTable?: Table
  context: QueryContext
  fields: FlattenedField[]
  joins: BuildQueryJoinAliases
  locale?: string
  parentIsLocalized: boolean
  selectFields: Record<string, GenericColumn>
  selectLocale?: boolean
  tableName: string
  where: Where
}

export function parseParams({
  adapter,
  aliasTable,
  context,
  fields,
  joins,
  locale,
  parentIsLocalized,
  selectFields,
  selectLocale,
  tableName,
  where,
}: Args): SQL {
  let result: SQL
  const constraints: SQL[] = []

  if (typeof where === 'object' && Object.keys(where).length > 0) {
    // We need to determine if the whereKey is an AND, OR, or a schema path
    for (const relationOrPath of Object.keys(where)) {
      if (relationOrPath) {
        const condition = where[relationOrPath]
        let conditionOperator: typeof and | typeof or
        if (relationOrPath.toLowerCase() === 'and') {
          conditionOperator = and
        } else if (relationOrPath.toLowerCase() === 'or') {
          conditionOperator = or
        }
        if (Array.isArray(condition)) {
          const builtConditions = buildAndOrConditions({
            adapter,
            aliasTable,
            context,
            fields,
            joins,
            locale,
            parentIsLocalized,
            selectFields,
            selectLocale,
            tableName,
            where: condition,
          })
          if (builtConditions.length > 0) {
            result = conditionOperator(...builtConditions)
          }
        } else {
          // It's a path - and there can be multiple comparisons on a single path.
          // For example - title like 'test' and title not equal to 'tester'
          // So we need to loop on keys again here to handle each operator independently
          const pathOperators = where[relationOrPath]
          if (typeof pathOperators === 'object') {
            for (let operator of Object.keys(pathOperators)) {
              if (validOperatorSet.has(operator as Operator)) {
                const val = where[relationOrPath][operator]
                const originalOperator = operator as Operator

                if (
                  hasManyRelationshipOperatorSet.has(operator as HasManyRelationshipOperator) &&
                  val !== null &&
                  typeof val === 'object' &&
                  !Array.isArray(val)
                ) {
                  const relationshipPath = resolveRelationshipPath({
                    adapter,
                    fields,
                    locale,
                    parentIsLocalized,
                    path: relationOrPath.replace(/__/g, '.'),
                  })

                  if (
                    relationshipPath?.field.hasMany &&
                    typeof relationshipPath.field.relationTo === 'string'
                  ) {
                    constraints.push(
                      buildHasManyRelationshipCondition({
                        adapter,
                        aliasTable,
                        fields,
                        locale,
                        operator: operator as HasManyRelationshipOperator,
                        parentIsLocalized,
                        relationOrPath,
                        tableName,
                        where: val as Where,
                      }),
                    )
                    continue
                  }
                }

                const {
                  columnName,
                  columns,
                  constraints: queryConstraints,
                  field,
                  getNotNullColumnByValue,
                  pathSegments,
                  rawColumn,
                  table,
                } = getTableColumnFromPath({
                  adapter,
                  aliasTable,
                  collectionPath: relationOrPath,
                  fields,
                  joins,
                  locale,
                  parentIsLocalized,
                  pathSegments: relationOrPath.replace(/__/g, '.').split('.'),
                  selectFields,
                  selectLocale,
                  tableName,
                  value: val,
                })

                const resolvedColumn =
                  rawColumn ||
                  (aliasTable && tableName === getNameFromDrizzleTable(table)
                    ? aliasTable[columnName]
                    : table[columnName])

                if (val === DistinctSymbol) {
                  selectFields['_selected'] = resolvedColumn
                  break
                }

                queryConstraints.forEach(({ columnName: col, table: constraintTable, value }) => {
                  if (typeof value === 'string' && value.indexOf('%') > -1) {
                    constraints.push(adapter.operators.like(constraintTable[col], value))
                  } else {
                    constraints.push(adapter.operators.equals(constraintTable[col], value))
                  }
                })

                if (
                  (['json', 'richText'].includes(field.type) ||
                    (field.type === 'blocks' && adapter.blocksAsJSON)) &&
                  Array.isArray(pathSegments) &&
                  pathSegments.length > 1
                ) {
                  if (adapter.name === 'postgres') {
                    const constraint = adapter.createJSONQuery({
                      column: rawColumn || table[columnName],
                      operator,
                      pathSegments,
                      value: val,
                    })

                    constraints.push(sql.raw(constraint))
                    break
                  }

                  const segments = pathSegments.slice(1)
                  segments.unshift(table[columnName].name)

                  if (field.type === 'richText') {
                    // use the table name from the nearest join to handle blocks, arrays, etc. or use the tableName arg
                    const jsonTable =
                      joins.length === 0
                        ? tableName
                        : joins[joins.length - 1].table[
                            Object.getOwnPropertySymbols(joins[joins.length - 1].table)[0]
                          ]
                    const jsonQuery = adapter.createJSONQuery({
                      operator,
                      pathSegments: segments,
                      table: jsonTable,
                      treatAsArray: ['children'],
                      treatRootAsArray: true,
                      value: val,
                    })

                    constraints.push(sql.raw(jsonQuery))
                    break
                  }

                  const jsonQuery = adapter.convertPathToJSONTraversal(pathSegments)
                  const operatorKeys: Record<string, { operator: string; wildcard: string }> = {
                    contains: { operator: 'like', wildcard: '%' },
                    equals: { operator: '=', wildcard: '' },
                    exists: { operator: val === true ? 'is not null' : 'is null', wildcard: '' },
                    in: { operator: 'in', wildcard: '' },
                    like: { operator: 'like', wildcard: '%' },
                    not_equals: { operator: '<>', wildcard: '' },
                    not_in: { operator: 'not in', wildcard: '' },
                    not_like: { operator: 'not like', wildcard: '%' },
                  }

                  let formattedValue = val
                  if (
                    adapter.name === 'sqlite' &&
                    operator === 'equals' &&
                    (typeof val === 'number' || typeof val === 'boolean')
                  ) {
                    formattedValue = val
                  } else if (['in', 'not_in'].includes(operator) && Array.isArray(val)) {
                    formattedValue = `(${val.map((v) => `${escapeSQLValue(v)}`).join(',')})`
                  } else {
                    formattedValue = `'${operatorKeys[operator].wildcard}${escapeSQLValue(val)}${operatorKeys[operator].wildcard}'`
                  }
                  if (operator === 'exists') {
                    formattedValue = ''
                  }

                  let jsonQuerySelector = `${table[columnName].name}${jsonQuery}`

                  if (adapter.name === 'sqlite' && operator === 'not_like') {
                    jsonQuerySelector = `COALESCE(${table[columnName].name}${jsonQuery}, '')`
                  }

                  const rawSQLQuery = `${jsonQuerySelector} ${operatorKeys[operator].operator} ${formattedValue}`

                  constraints.push(sql.raw(rawSQLQuery))

                  break
                }

                if (getNotNullColumnByValue) {
                  const columnName = getNotNullColumnByValue(val)
                  if (columnName) {
                    constraints.push(isNotNull(table[columnName]))
                  } else {
                    throw new QueryError([{ path: relationOrPath }])
                  }
                  break
                }

                if (
                  operator === 'like' &&
                  (field.type === 'number' ||
                    field.type === 'relationship' ||
                    field.type === 'upload' ||
                    table[columnName].columnType === 'PgUUID')
                ) {
                  operator = 'equals'
                }

                if (operator === 'like') {
                  constraints.push(
                    and(
                      ...val.split(' ').map((word) =>
                        buildOperatorConstraint({
                          adapter,
                          column: table[columnName],
                          field,
                          locale,
                          originalOperator,
                          path: relationOrPath,
                          resolvedOperator: 'like',
                          value: `%${word}%`,
                        }),
                      ),
                    ),
                  )
                  break
                }

                const sanitizedQueryValue = sanitizeQueryValue({
                  adapter,
                  columns,
                  field,
                  isUUID: table?.[columnName] instanceof PgUUID,
                  operator,
                  relationOrPath,
                  val,
                })

                if (sanitizedQueryValue === null) {
                  break
                }

                const {
                  columns: queryColumns,
                  operator: queryOperator,
                  value: queryValue,
                } = sanitizedQueryValue

                // Handle polymorphic relationships by value
                if (queryColumns) {
                  if (!queryColumns.length) {
                    break
                  }

                  let wrapOperator = or

                  if (queryValue === null && ['equals', 'not_equals'].includes(operator)) {
                    if (operator === 'equals') {
                      wrapOperator = and
                    }

                    constraints.push(
                      wrapOperator(
                        ...queryColumns.map(({ rawColumn }) =>
                          operator === 'equals' ? isNull(rawColumn) : isNotNull(rawColumn),
                        ),
                      ),
                    )
                    break
                  }

                  if (['not_equals', 'not_in'].includes(operator)) {
                    wrapOperator = and
                  }

                  constraints.push(
                    wrapOperator(
                      ...queryColumns.map(({ rawColumn, value }) =>
                        buildOperatorConstraint({
                          adapter,
                          column: rawColumn,
                          field,
                          locale,
                          originalOperator,
                          path: relationOrPath,
                          resolvedOperator: queryOperator as DrizzleResolvedOperator,
                          value,
                        }),
                      ),
                    ),
                  )

                  break
                }

                if (queryOperator === 'not_equals' && queryValue !== null) {
                  constraints.push(
                    or(
                      isNull(resolvedColumn),
                      buildOperatorConstraint({
                        adapter,
                        column: resolvedColumn,
                        field,
                        locale,
                        originalOperator,
                        path: relationOrPath,
                        resolvedOperator: 'not_equals',
                        value: queryValue,
                      }),
                    ),
                  )
                  break
                }

                if (
                  (field.type === 'relationship' || field.type === 'upload') &&
                  Array.isArray(queryValue) &&
                  queryOperator === 'not_in'
                ) {
                  constraints.push(
                    sql`(${notInArray(table[columnName], queryValue)} OR
                    ${table[columnName]}
                    IS
                    NULL)`,
                  )

                  break
                }

                if (operator === 'equals' && queryValue === null) {
                  constraints.push(isNull(resolvedColumn))
                  break
                }

                if (operator === 'not_equals' && queryValue === null) {
                  constraints.push(isNotNull(resolvedColumn))
                  break
                }

                if (field.type === 'point' && adapter.name === 'postgres') {
                  switch (operator) {
                    case 'intersects': {
                      constraints.push(
                        sql`ST_Intersects(${table[columnName]}, ST_GeomFromGeoJSON(${JSON.stringify(queryValue)}))`,
                      )
                      break
                    }

                    case 'near': {
                      const [lng, lat, maxDistance, minDistance] = queryValue as number[]
                      const geoConstraints: SQL[] = []

                      if (typeof maxDistance === 'number' && !Number.isNaN(maxDistance)) {
                        geoConstraints.push(
                          sql`ST_DWithin(${table[columnName]}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${maxDistance})`,
                        )
                      }

                      if (typeof minDistance === 'number' && !Number.isNaN(minDistance)) {
                        geoConstraints.push(
                          sql`ST_Distance(${table[columnName]}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) >= ${minDistance}`,
                        )
                      }
                      if (geoConstraints.length) {
                        context.sort = relationOrPath
                        context.rawSort = sql`${table[columnName]} <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`
                        constraints.push(and(...geoConstraints))
                      }
                      break
                    }

                    case 'within': {
                      constraints.push(
                        sql`ST_Within(${table[columnName]}, ST_GeomFromGeoJSON(${JSON.stringify(queryValue)}))`,
                      )
                      break
                    }

                    default:
                      break
                  }
                  break
                }

                const orConditions: SQL<unknown>[] = []
                let resolvedQueryValue = queryValue
                if (
                  operator === 'in' &&
                  Array.isArray(queryValue) &&
                  queryValue.some((v) => v === null)
                ) {
                  orConditions.push(isNull(resolvedColumn))
                  resolvedQueryValue = queryValue.filter((v) => v !== null)
                }

                if (
                  operator === 'contains' &&
                  Array.isArray(queryValue) &&
                  'hasMany' in field &&
                  field.hasMany &&
                  ['number', 'select', 'text'].includes(field.type)
                ) {
                  // Create OR conditions for each value in the array
                  orConditions.push(
                    ...queryValue.map((val) =>
                      buildOperatorConstraint({
                        adapter,
                        column: resolvedColumn,
                        field,
                        locale,
                        originalOperator,
                        path: relationOrPath,
                        resolvedOperator: queryOperator as DrizzleResolvedOperator,
                        value: val,
                      }),
                    ),
                  )
                  // Set constraint to combine all OR conditions
                  const constraint = orConditions.length > 0 ? or(...orConditions) : undefined
                  if (constraint) {
                    constraints.push(constraint)
                  }
                  break
                }

                let constraint = buildOperatorConstraint({
                  adapter,
                  column: resolvedColumn,
                  field,
                  locale,
                  originalOperator,
                  path: relationOrPath,
                  resolvedOperator: queryOperator as DrizzleResolvedOperator,
                  value: resolvedQueryValue,
                })

                if (
                  adapter.limitedBoundParameters &&
                  (operator === 'in' || operator === 'not_in') &&
                  relationOrPath === 'id' &&
                  Array.isArray(queryValue)
                ) {
                  let isInvalid = false
                  for (const val of queryValue) {
                    if (typeof val === 'number' || val === null) {
                      continue
                    }
                    if (typeof val === 'string') {
                      if (!isValidStringID(val)) {
                        isInvalid = true
                        break
                      } else {
                        continue
                      }
                    }
                    isInvalid = true
                    break
                  }

                  if (isInvalid) {
                    throw new APIError(`Invalid ID value in ${JSON.stringify(queryValue)}`)
                  }

                  constraints.push(
                    sql.raw(
                      `"${getTableName(resolvedColumn.table)}"."${resolvedColumn.name}" ${operator === 'in' ? 'IN' : 'NOT IN'} (${queryValue
                        .map((e) => {
                          if (e === null) {
                            return `NULL`
                          }

                          if (typeof e === 'number') {
                            return e
                          }

                          return `'${e}'`
                        })
                        .join(',')})`,
                    ),
                  )
                  break
                }

                if (orConditions.length) {
                  orConditions.push(constraint)
                  constraint = or(...orConditions)
                }
                constraints.push(constraint)
              }
            }
          }
        }
      }
    }
  }
  if (constraints.length > 0) {
    if (result) {
      result = and(result, ...constraints)
    } else {
      result = and(...constraints)
    }
  }
  if (constraints.length === 1 && !result) {
    ;[result] = constraints
  }

  return result
}

/**
 * Builds a SQL condition for an operator containing a nested has-many relationship query.
 *
 * `contains`: at least one related document matches.
 * `not_equals`: no related documents match.
 * `equals`: all related documents match; an empty relationship also matches.
 *
 * A normal dotted relationship query adds joins to the parent query. That cannot implement
 * the negative cases, because they must inspect all relationship rows before deciding whether to
 * include the parent. A correlated `EXISTS` subquery keeps that decision scoped to one parent.
 *
 * @example
 * ```ts
 * // Find burgers with no unhealthy ingredients.
 * const where = {
 *   ingredients: {
 *     not_equals: {
 *       isHealthy: { equals: false },
 *     },
 *   },
 * }
 * ```
 */
function buildHasManyRelationshipCondition({
  adapter,
  aliasTable,
  fields,
  locale,
  operator,
  parentIsLocalized,
  relationOrPath,
  tableName,
  where,
}: {
  adapter: DrizzleAdapter
  aliasTable?: Table
  fields: FlattenedField[]
  locale?: string
  operator: HasManyRelationshipOperator
  parentIsLocalized: boolean
  relationOrPath: string
  tableName: string
  where: Where
}): SQL {
  const relationshipFieldPath = relationOrPath.replace(/__/g, '.')

  if (!where || typeof where !== 'object' || Array.isArray(where)) {
    throw new QueryError([{ path: `${relationshipFieldPath}.${operator}` }])
  }

  const relationshipPath = resolveRelationshipPath({
    adapter,
    fields,
    locale,
    parentIsLocalized,
    path: relationshipFieldPath,
  })

  if (!relationshipPath) {
    throw new QueryError([{ path: `${relationshipFieldPath}.${operator}` }])
  }

  const relationshipField = relationshipPath.field

  if (!relationshipField.hasMany || typeof relationshipField.relationTo !== 'string') {
    throw new QueryError([{ path: `${relationshipFieldPath}.${operator}` }])
  }

  // Every related document matches an empty query, including when there are no related documents.
  if (operator === 'equals' && Object.keys(where).length === 0) {
    return sql`true`
  }

  const relationshipTableName = `${tableName}${adapter.relationshipsSuffix}`
  const relatedCollection = adapter.payload.collections[relationshipField.relationTo]
  const relatedTableName = adapter.tableNameMap.get(toSnakeCase(relatedCollection.config.slug))
  const relationshipLocale = relationshipPath.locale
  const { newAliasTable: relationshipTable } = getTableAlias({
    adapter,
    tableName: relationshipTableName,
  })
  const { newAliasTable: relatedTable } = getTableAlias({
    adapter,
    tableName: relatedTableName,
  })

  // Parse the nested `where` exactly like a normal query, but start from the related collection
  // and keep its joins inside the subquery.
  const nestedJoins: BuildQueryJoinAliases = []
  const relatedDocumentWhere =
    Object.keys(where).length > 0
      ? parseParams({
          adapter,
          aliasTable: relatedTable,
          context: { sort: undefined },
          fields: relatedCollection.config.flattenedFields,
          joins: nestedJoins,
          locale: relationshipLocale,
          parentIsLocalized: false,
          selectFields: {},
          tableName: relatedTableName,
          where,
        })
      : undefined

  // Correlate relationship rows back to the parent document currently being considered by the
  // outer query. The stored path distinguishes this field from other relationships on the parent.
  const outerTable = aliasTable ?? aliasedTable(adapter.tables[tableName], tableName)
  const relationshipRowConstraints: SQL[] = [
    eq(relationshipTable.parent, outerTable.id),
    relationshipPath.path.includes('%')
      ? like(relationshipTable.path, relationshipPath.path)
      : eq(relationshipTable.path, relationshipPath.path),
  ]

  if (relationshipLocale && relationshipLocale !== 'all' && relationshipPath.isLocalized) {
    relationshipRowConstraints.push(eq(relationshipTable.locale, relationshipLocale))
  }

  const relatedDocumentConstraints = [
    eq(relatedTable.id, relationshipTable[`${relationshipField.relationTo}ID`]),
  ]

  if (relatedDocumentWhere) {
    relatedDocumentConstraints.push(relatedDocumentWhere)
  }

  let relatedDocumentSubquery = (adapter.drizzle as any)
    .select({ id: relatedTable.id })
    .from(relatedTable)
    .$dynamic()

  for (const join of nestedJoins) {
    relatedDocumentSubquery = relatedDocumentSubquery[join.type ?? 'leftJoin'](
      join.table,
      join.condition,
    )
  }

  relatedDocumentSubquery = relatedDocumentSubquery.where(and(...relatedDocumentConstraints))

  const buildRelationshipRowsSubquery = (relatedDocumentCheck: SQL) =>
    (adapter.drizzle as any)
      .select({ id: relationshipTable.parent })
      .from(relationshipTable)
      .where(and(...relationshipRowConstraints, relatedDocumentCheck))

  switch (operator) {
    case 'contains':
      return exists(buildRelationshipRowsSubquery(exists(relatedDocumentSubquery)))

    case 'equals':
      // All related documents match when no relationship row points to one that fails.
      return notExists(buildRelationshipRowsSubquery(notExists(relatedDocumentSubquery)))

    case 'not_equals':
      return notExists(buildRelationshipRowsSubquery(exists(relatedDocumentSubquery)))
  }
}

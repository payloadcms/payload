import type { SQL, Table } from 'drizzle-orm'
import type { FlattenedField, Operator, Sort, Where } from 'payload'

import { and, isNotNull, isNull, ne, notInArray, or, sql } from 'drizzle-orm'
import { PgUUID } from 'drizzle-orm/pg-core'
import { APIError, QueryError } from 'payload'
import { validOperatorSet } from 'payload/shared'

import type { DrizzleAdapter, GenericColumn } from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js'
import { isValidStringID } from '../utilities/isValidStringID.js'
import { DistinctSymbol } from '../utilities/rawConstraint.js'
import { buildAndOrConditions } from './buildAndOrConditions.js'
import { getTableColumnFromPath } from './getTableColumnFromPath.js'
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
                  if (adapter.name === 'sqlite' && operator === 'equals' && !isNaN(val)) {
                    formattedValue = val
                  } else if (['in', 'not_in'].includes(operator) && Array.isArray(val)) {
                    formattedValue = `(${val.map((v) => `${v}`).join(',')})`
                  } else {
                    formattedValue = `'${operatorKeys[operator].wildcard}${val}${operatorKeys[operator].wildcard}'`
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
                      ...val
                        .split(' ')
                        .map((word) => adapter.operators.like(table[columnName], `%${word}%`)),
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
                        adapter.operators[queryOperator](rawColumn, value),
                      ),
                    ),
                  )

                  break
                }

                if (queryOperator === 'not_equals' && queryValue !== null) {
                  constraints.push(
                    or(
                      isNull(resolvedColumn),
                      /* eslint-disable @typescript-eslint/no-explicit-any */
                      ne<any>(resolvedColumn, queryValue),
                    ),
                  )
                  break
                }

                if (
                  (field.type === 'relationship' || field.type === 'upload') &&
                  Array.isArray(queryValue) &&
                  operator === 'not_in'
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
                          sql`ST_DWithin(ST_Transform(${table[columnName]}, 3857), ST_Transform(ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), 3857), ${maxDistance})`,
                        )
                      }

                      if (typeof minDistance === 'number' && !Number.isNaN(minDistance)) {
                        geoConstraints.push(
                          sql`ST_Distance(ST_Transform(${table[columnName]}, 3857), ST_Transform(ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), 3857)) >= ${minDistance}`,
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

                let constraint = adapter.operators[queryOperator](
                  resolvedColumn,
                  resolvedQueryValue,
                )

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
                      `${resolvedColumn.name} ${operator === 'in' ? 'IN' : 'NOT IN'} (${queryValue
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

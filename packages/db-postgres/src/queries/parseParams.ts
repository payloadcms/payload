/* eslint-disable no-await-in-loop */
import type { SQL } from 'drizzle-orm'
import type { Field, Operator, Where } from 'payload/types'

import { and, ilike, isNotNull, isNull, ne, notInArray, or, sql } from 'drizzle-orm'
import { QueryError } from 'payload/errors'
import { validOperators } from 'payload/types'

import type { GenericColumn, PostgresAdapter } from '../types'
import type { BuildQueryJoinAliases, BuildQueryJoins } from './buildQuery'

import { buildAndOrConditions } from './buildAndOrConditions'
import { createJSONQuery } from './createJSONQuery'
import { convertPathToJSONTraversal } from './createJSONQuery/convertPathToJSONTraversal'
import { getTableColumnFromPath } from './getTableColumnFromPath'
import { operatorMap } from './operatorMap'
import { sanitizeQueryValue } from './sanitizeQueryValue'

type Args = {
  adapter: PostgresAdapter
  fields: Field[]
  joinAliases: BuildQueryJoinAliases
  joins: BuildQueryJoins
  locale: string
  selectFields: Record<string, GenericColumn>
  tableName: string
  where: Where
}

export async function parseParams({
  adapter,
  fields,
  joinAliases,
  joins,
  locale,
  selectFields,
  tableName,
  where,
}: Args): Promise<SQL> {
  let result: SQL
  const constraints: SQL[] = []

  if (typeof where === 'object' && Object.keys(where).length > 0) {
    // We need to determine if the whereKey is an AND, OR, or a schema path
    for (const relationOrPath of Object.keys(where)) {
      if (relationOrPath) {
        const condition = where[relationOrPath]
        let conditionOperator: 'and' | 'or'
        if (relationOrPath.toLowerCase() === 'and') {
          conditionOperator = 'and'
        } else if (relationOrPath.toLowerCase() === 'or') {
          conditionOperator = 'or'
        }
        if (Array.isArray(condition)) {
          const builtConditions = await buildAndOrConditions({
            adapter,
            fields,
            joinAliases,
            joins,
            locale,
            selectFields,
            tableName,
            where: condition,
          })
          if (builtConditions.length > 0) {
            result = operatorMap[conditionOperator](...builtConditions)
          }
        } else {
          // It's a path - and there can be multiple comparisons on a single path.
          // For example - title like 'test' and title not equal to 'tester'
          // So we need to loop on keys again here to handle each operator independently
          const pathOperators = where[relationOrPath]
          if (typeof pathOperators === 'object') {
            for (let operator of Object.keys(pathOperators)) {
              if (validOperators.includes(operator as Operator)) {
                const val = where[relationOrPath][operator]
                const {
                  columnName,
                  constraints: queryConstraints,
                  field,
                  getNotNullColumnByValue,
                  pathSegments,
                  rawColumn,
                  table,
                } = getTableColumnFromPath({
                  adapter,
                  collectionPath: relationOrPath,
                  fields,
                  joinAliases,
                  joins,
                  locale,
                  pathSegments: relationOrPath.replace(/__/g, '.').split('.'),
                  selectFields,
                  tableName,
                  value: val,
                })

                queryConstraints.forEach(({ columnName: col, table: constraintTable, value }) => {
                  if (typeof value === 'string' && value.indexOf('%') > -1) {
                    constraints.push(operatorMap.like(constraintTable[col], value))
                  } else {
                    constraints.push(operatorMap.equals(constraintTable[col], value))
                  }
                })

                if (
                  ['json', 'richText'].includes(field.type) &&
                  Array.isArray(pathSegments) &&
                  pathSegments.length > 1
                ) {
                  const segments = pathSegments.slice(1)
                  segments.unshift(table[columnName].name)

                  if (field.type === 'richText') {
                    const jsonQuery = createJSONQuery({
                      operator,
                      pathSegments: segments,
                      treatAsArray: ['children'],
                      treatRootAsArray: true,
                      value: val,
                    })

                    constraints.push(sql.raw(jsonQuery))
                    break
                  }

                  const jsonQuery = convertPathToJSONTraversal(pathSegments)
                  const operatorKeys = {
                    contains: { operator: 'ilike', wildcard: '%' },
                    equals: { operator: '=', wildcard: '' },
                    exists: { operator: val === true ? 'is not null' : 'is null' },
                    like: { operator: 'like', wildcard: '%' },
                    not_equals: { operator: '<>', wildcard: '' },
                  }
                  let formattedValue = `'${operatorKeys[operator].wildcard}${val}${operatorKeys[operator].wildcard}'`

                  if (operator === 'exists') {
                    formattedValue = ''
                  }

                  constraints.push(
                    sql.raw(
                      `${table[columnName].name}${jsonQuery} ${operatorKeys[operator].operator} ${formattedValue}`,
                    ),
                  )

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
                  (field.type === 'number' || table[columnName].columnType === 'PgUUID')
                ) {
                  operator = 'equals'
                }

                if (operator === 'like') {
                  constraints.push(
                    and(...val.split(' ').map((word) => ilike(table[columnName], `%${word}%`))),
                  )
                  break
                }

                const sanitizedQueryValue = sanitizeQueryValue({
                  adapter,
                  field,
                  operator,
                  relationOrPath,
                  val,
                })

                if (sanitizedQueryValue === null) {
                  break
                }

                const { operator: queryOperator, value: queryValue } = sanitizedQueryValue

                if (queryOperator === 'not_equals' && queryValue !== null) {
                  constraints.push(
                    or(
                      isNull(rawColumn || table[columnName]),
                      /* eslint-disable @typescript-eslint/no-explicit-any */
                      ne<any>(rawColumn || table[columnName], queryValue),
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
                  constraints.push(isNull(rawColumn || table[columnName]))
                  break
                }

                if (operator === 'not_equals' && queryValue === null) {
                  constraints.push(isNotNull(rawColumn || table[columnName]))
                  break
                }

                constraints.push(
                  operatorMap[queryOperator](rawColumn || table[columnName], queryValue),
                )
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

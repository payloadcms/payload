import { APIError } from 'payload'

import type { CreateJSONQueryArgs } from '../../types.js'

import { escapeSQLValue, SAFE_STRING_REGEX } from '../../utilities/escapeSQLValue.js'
import { parseJSONPathSegment } from '../../utilities/parseJSONPathSegment.js'

const operatorMap: Record<string, string> = {
  contains: '~',
  equals: '==',
  greater_than: '>',
  greater_than_equal: '>=',
  in: 'in',
  less_than: '<',
  less_than_equal: '<=',
  like: 'like_regex',
  not_equals: '!=',
  not_in: 'in',
  not_like: '!like_regex',
}

const sanitizeValue = (value: unknown, operator?: string): string => {
  if (value === null) {
    return `null`
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`
  }

  if (typeof value !== 'string') {
    throw new Error('Invalid value type')
  }

  if (!SAFE_STRING_REGEX.test(value)) {
    throw new APIError(`${value} is not allowed as a JSON query value`, 400)
  }

  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const prefix = ['like', 'not_like'].includes(operator ?? '') ? '(?i)' : ''

  return `"${prefix}${escaped}"`
}

const createDateOnlyJSONQuery = ({
  columnName,
  fullPath,
  operator,
  value,
}: {
  columnName: string
  fullPath: string
  operator: string
  value: unknown
}): string => {
  const valueAlias = 'date_filter_value'
  const textValue = `(${valueAlias}.value #>> '{}')`
  const isoDate = `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`
  const isoDateTime = `^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}(:[0-9]{2}([.][0-9]+)?)?`
  const offsetSuffix = `(Z|[+-][0-9]{2}:?[0-9]{2})$`
  // Payload serializes date values as UTC, so legacy offset-free ISO values retain that meaning.
  const instantValue = [
    'CASE',
    `WHEN ${textValue} ~ '${isoDateTime}${offsetSuffix}' THEN ${textValue}::timestamptz`,
    `WHEN ${textValue} ~ '(${isoDate}|${isoDateTime}$)' THEN ${textValue}::timestamp AT TIME ZONE 'UTC'`,
    'END',
  ].join(' ')
  const createExistsQuery = (predicate: string): string =>
    `EXISTS (SELECT 1 FROM jsonb_path_query(${columnName}, '${fullPath}') AS ${valueAlias}(value) WHERE ${predicate})`

  if (['date_equals', 'date_not_equals'].includes(operator)) {
    if (!Array.isArray(value) || typeof value[0] !== 'string' || typeof value[1] !== 'string') {
      throw new Error('Invalid date-only JSON comparison')
    }

    const start = escapeSQLValue(value[0])
    const end = escapeSQLValue(value[1])
    const existsQuery = createExistsQuery(
      `${instantValue} >= '${start}'::timestamptz AND ${instantValue} < '${end}'::timestamptz`,
    )

    return operator === 'date_not_equals' ? `${existsQuery} IS NOT TRUE` : existsQuery
  }

  const comparisonOperator = operatorMap[operator.slice(5)]

  if (!comparisonOperator || typeof value !== 'string') {
    throw new Error('Invalid date-only JSON comparison')
  }

  return createExistsQuery(
    `${instantValue} ${comparisonOperator} '${escapeSQLValue(value)}'::timestamptz`,
  )
}

export const createJSONQuery = ({
  column,
  operator,
  pathSegments,
  treatRootAsArray,
  value,
}: CreateJSONQueryArgs) => {
  const columnName = typeof column === 'object' ? column.name : column
  const jsonPaths = pathSegments
    .slice(1)
    .map((key) => {
      return `${parseJSONPathSegment(key).value}[*]`
    })
    .join('.')

  const fullPath =
    pathSegments.length === 1 ? '$[*]' : `${treatRootAsArray ? '$[*]' : '$'}.${jsonPaths}`
  const resolvedOperator = operator.startsWith('date_') ? operator.slice(5) : operator

  let sql = ''

  if (operator.startsWith('date_')) {
    sql = createDateOnlyJSONQuery({ columnName, fullPath, operator, value })
  } else if (['in', 'not_in'].includes(operator) && Array.isArray(value)) {
    sql = '('
    value.forEach((item, i) => {
      sql = `${sql}${createJSONQuery({ column, operator: operator === 'in' ? 'equals' : 'not_equals', pathSegments, value: item })}${i === value.length - 1 ? '' : ` ${operator === 'in' ? 'OR' : 'AND'} `}`
    })
    sql = `${sql})`
  } else if (operator === 'exists') {
    sql = `${value === false ? 'NOT ' : ''}jsonb_path_exists(${columnName}, '${fullPath}')`
  } else if (['not_like'].includes(operator)) {
    const mappedOperator = operatorMap[operator]

    sql = `NOT jsonb_path_exists(${columnName}, '${fullPath} ? (@ ${mappedOperator.substring(1)} ${sanitizeValue(value, operator)})')`
  } else {
    sql = `jsonb_path_exists(${columnName}, '${fullPath} ? (@ ${operatorMap[resolvedOperator]} ${sanitizeValue(value, resolvedOperator)})')`
  }

  return sql
}

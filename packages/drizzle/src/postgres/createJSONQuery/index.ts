import { APIError } from 'payload'

import type { CreateJSONQueryArgs } from '../../types.js'

import { SAFE_STRING_REGEX } from '../../utilities/escapeSQLValue.js'
import { parseJSONPathSegment } from '../../utilities/parseJSONPathSegment.js'

const operatorMap: Record<string, string> = {
  contains: 'like_regex',
  equals: '==',
  in: 'in',
  like: 'like_regex',
  not_equals: '!=',
  not_in: 'in',
  not_like: '!like_regex',
}

const regexOperators = new Set(['contains', 'like', 'not_like'])

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

  const isRegexOperator = regexOperators.has(operator ?? '')
  // Regex operators match the value as a substring, so characters like `.` must stay literal.
  const pattern = isRegexOperator ? value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : value
  const escaped = pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const prefix = isRegexOperator ? '(?i)' : ''

  return `"${prefix}${escaped}"`
}

export const createJSONQuery = ({ column, operator, pathSegments, value }: CreateJSONQueryArgs) => {
  const columnName = typeof column === 'object' ? column.name : column
  const jsonPath = pathSegments.slice(1).reduce((path, segment) => {
    const parsedSegment = parseJSONPathSegment(segment)

    if (parsedSegment.type === 'arrayIndex') {
      // Index the array the previous segment selected instead of unwrapping every item of it.
      return `${path.endsWith('[*]') ? path.slice(0, -3) : path}[${parsedSegment.value}]`
    }

    return `${path}.${parsedSegment.value}[*]`
  }, '$')

  const fullPath = pathSegments.length === 1 ? '$[*]' : jsonPath

  let sql = ''

  if (['in', 'not_in'].includes(operator) && Array.isArray(value)) {
    sql = '('
    value.forEach((item, i) => {
      sql = `${sql}${createJSONQuery({ column, operator: operator === 'in' ? 'equals' : 'not_equals', pathSegments, value: item })}${i === value.length - 1 ? '' : ` ${operator === 'in' ? 'OR' : 'AND'} `}`
    })
    sql = `${sql})`
  } else if (operator === 'exists') {
    // `jsonb_path_exists` returns NULL for a NULL column, so negated checks must match it explicitly.
    sql =
      value === false
        ? `(${columnName} IS NULL OR NOT jsonb_path_exists(${columnName}, '${fullPath}'))`
        : `jsonb_path_exists(${columnName}, '${fullPath}')`
  } else if (['not_like'].includes(operator)) {
    const mappedOperator = operatorMap[operator]

    sql = `(${columnName} IS NULL OR NOT jsonb_path_exists(${columnName}, '${fullPath} ? (@ ${mappedOperator.substring(1)} ${sanitizeValue(value, operator)})'))`
  } else {
    sql = `jsonb_path_exists(${columnName}, '${fullPath} ? (@ ${operatorMap[operator]} ${sanitizeValue(value, operator)})')`
  }

  return sql
}

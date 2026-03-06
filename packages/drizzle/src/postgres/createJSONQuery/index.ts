import { APIError } from 'payload'

import type { CreateJSONQueryArgs } from '../../types.js'

import { SAFE_STRING_REGEX } from '../../utilities/escapeSQLValue.js'

const operatorMap: Record<string, string> = {
  contains: '~',
  equals: '==',
  in: 'in',
  like: 'like_regex',
  not_equals: '!=',
  not_in: 'in',
  not_like: '!like_regex',
}

const sanitizeValue = (value: unknown, operator?: string): string => {
  if (value === null) {
    return `NULL`
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

export const createJSONQuery = ({ column, operator, pathSegments, value }: CreateJSONQueryArgs) => {
  const columnName = typeof column === 'object' ? column.name : column
  const jsonPaths = pathSegments
    .slice(1)
    .map((key) => {
      return `${key}[*]`
    })
    .join('.')

  const fullPath = pathSegments.length === 1 ? '$[*]' : `$.${jsonPaths}`

  let sql = ''

  if (['in', 'not_in'].includes(operator) && Array.isArray(value)) {
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
    sql = `jsonb_path_exists(${columnName}, '${fullPath} ? (@ ${operatorMap[operator]} ${sanitizeValue(value, operator)})')`
  }

  return sql
}

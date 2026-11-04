import { APIError } from 'payload'

import type { CreateJSONQueryArgs } from '../../types.js'

import { SAFE_STRING_REGEX } from '../../utilities/escapeSQLValue.js'
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

export const createJSONQuery = ({ column, operator, pathSegments, value }: CreateJSONQueryArgs) => {
  const columnName = typeof column === 'object' ? column.name : column
  const jsonPaths = pathSegments
    .slice(1)
    .map((key) => {
      return `${parseJSONPathSegment(key).value}[*]`
    })
    .join('.')

  const fullPath = pathSegments.length === 1 ? '$[*]' : `$.${jsonPaths}`
  const resolvedOperator = operator.startsWith('date_') ? operator.slice(5) : operator

  let sql = ''

  if (['date_equals', 'date_not_equals'].includes(operator) && Array.isArray(value)) {
    const [start, end] = value

    if (typeof start !== 'string' || typeof end !== 'string') {
      throw new Error('Invalid date-only JSON comparison')
    }

    const predicate = `@ >= ${sanitizeValue(start)} && @ < ${sanitizeValue(end)}`

    const pathExists = `jsonb_path_exists(${columnName}, '${fullPath} ? (${predicate})')`

    sql = operator === 'date_not_equals' ? `${pathExists} IS NOT TRUE` : pathExists
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

import type { CreateJSONQueryArgs } from '../../types.js'

import { escapeSQLValue } from '../../utilities/escapeSQLValue.js'
import { sanitizePathSegment } from '../../utilities/sanitizePathSegment.js'
import { convertPathToJSONTraversal } from './convertPathToJSONTraversal.js'

/**
 * Builds a SQL Server predicate that reaches into a JSON (`nvarchar(max)`) column.
 *
 * SQL Server exposes scalar JSON values via `JSON_VALUE(column, '$.path')` and arrays via
 * `OPENJSON(column, '$.path')`. This is a best-effort translation of Payload's abstract JSON
 * query model onto those primitives — it covers scalar comparisons (`equals`, `like`, `contains`,
 * `not_like`) and array membership/existence (`exists`, `in`, `not_in`). Deeply-nested recursive
 * array traversal is not fully modelled.
 */
export const createJSONQuery = ({
  column,
  operator,
  pathSegments,
  rawColumn,
  table,
  treatAsArray,
  treatRootAsArray,
  value,
}: CreateJSONQueryArgs): string => {
  if ((operator === 'in' || operator === 'not_in') && Array.isArray(value)) {
    const joiner = operator === 'in' ? ' OR ' : ' AND '
    return value
      .map((v) =>
        createJSONQuery({
          column,
          operator: operator === 'in' ? 'equals' : 'not_equals',
          pathSegments,
          rawColumn,
          table,
          treatAsArray,
          treatRootAsArray,
          value: v,
        }),
      )
      .join(joiner)
  }

  let columnRef: string
  if (rawColumn) {
    columnRef = String(rawColumn)
  } else if (column) {
    columnRef = typeof column === 'string' ? column : `[${(column as { name: string }).name}]`
  } else {
    columnRef = `${table ? `${table}.` : ''}[${sanitizePathSegment(pathSegments[0])}]`
  }

  const jsonPath = convertPathToJSONTraversal(pathSegments)
  const isRootArray = treatRootAsArray || (treatAsArray && treatAsArray.length > 0)

  if (operator === 'exists') {
    const predicate =
      jsonPath === '$'
        ? `EXISTS (SELECT 1 FROM OPENJSON(${columnRef}))`
        : `JSON_VALUE(${columnRef}, '${jsonPath}') IS NOT NULL OR JSON_QUERY(${columnRef}, '${jsonPath}') IS NOT NULL`
    return value === false ? `NOT (${predicate})` : `(${predicate})`
  }

  if (operator === 'not_exists') {
    return `(JSON_VALUE(${columnRef}, '${jsonPath}') IS NULL AND JSON_QUERY(${columnRef}, '${jsonPath}') IS NULL)`
  }

  let formattedValue = escapeSQLValue(value as boolean | number | string)
  let formattedOperator = operator

  if (['contains', 'like'].includes(operator)) {
    formattedOperator = 'LIKE'
    formattedValue = `%${value}%`
  } else if (['not_like', 'notlike'].includes(operator)) {
    formattedOperator = 'NOT LIKE'
    formattedValue = `%${value}%`
  } else if (operator === 'equals') {
    formattedOperator = '='
  } else if (operator === 'not_equals') {
    formattedOperator = '<>'
  }

  const selector = `JSON_VALUE(${columnRef}, '${jsonPath}')`

  // Array membership: scan the array values with OPENJSON.
  if (isRootArray) {
    return `EXISTS (SELECT 1 FROM OPENJSON(${columnRef}) WHERE COALESCE([value], '') ${formattedOperator} '${formattedValue}')`
  }

  return `COALESCE(${selector}, '') ${formattedOperator} '${formattedValue}'`
}

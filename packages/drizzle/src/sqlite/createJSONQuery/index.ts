import type { CreateJSONQueryArgs } from '../../types.js'

import { escapeSQLValue } from '../../utilities/escapeSQLValue.js'
import { sanitizePathSegment } from '../../utilities/sanitizePathSegment.js'

type FromArrayArgs = {
  isRoot?: true
  operator: string
  pathSegments: string[]
  table: string
  treatAsArray?: string[]
  value: boolean | number | string
}

const fromArray = ({
  isRoot,
  operator,
  pathSegments,
  table,
  treatAsArray,
  value,
}: FromArrayArgs) => {
  const newPathSegments = pathSegments.slice(1)
  const sanitizedSegment = sanitizePathSegment(pathSegments[isRoot ? 0 : 1])
  const alias = `${sanitizedSegment}_alias_${newPathSegments.length}`

  return `EXISTS (
    SELECT 1
    FROM json_each(${table}.${sanitizePathSegment(pathSegments[0])}) AS ${alias}
    WHERE ${createJSONQuery({
      operator,
      pathSegments: newPathSegments,
      table: alias,
      treatAsArray,
      value,
    })}
  )`
}

type CreateConstraintArgs = {
  alias?: string
  operator: string
  pathSegments: string[]
  rootColumn?: string
  treatAsArray?: string[]
  value: boolean | number | string
}

const createConstraint = ({
  alias,
  operator,
  pathSegments,
  rootColumn,
  value,
}: CreateConstraintArgs): string => {
  const newAlias = `${pathSegments[0]}_alias_${pathSegments.length - 1}`

  if (operator === 'exists' && value === false) {
    operator = 'not_exists'
    value = true
  } else if (operator === 'not_exists' && value === false) {
    operator = 'exists'
    value = true
  }

  if (operator === 'exists') {
    if (pathSegments.length === 1) {
      return `EXISTS (SELECT 1 FROM json_each(${rootColumn ?? `"${sanitizePathSegment(pathSegments[0])}"`}) AS ${newAlias})`
    }

    return `EXISTS (
      SELECT 1
      FROM json_each(${alias}.value -> '${sanitizePathSegment(pathSegments[0])}') AS ${newAlias}
      WHERE ${newAlias}.key = '${sanitizePathSegment(pathSegments[1])}'
    )`
  }

  if (operator === 'not_exists') {
    if (pathSegments.length === 1) {
      return `NOT EXISTS (SELECT 1 FROM json_each(${rootColumn ?? `"${sanitizePathSegment(pathSegments[0])}"`}) AS ${newAlias})`
    }

    return `NOT EXISTS (
      SELECT 1
      FROM json_each(${alias}.value -> '${sanitizePathSegment(pathSegments[0])}') AS ${newAlias}
      WHERE ${newAlias}.key = '${sanitizePathSegment(pathSegments[1])}'
    )`
  }

  let formattedValue = escapeSQLValue(value)
  let formattedOperator = operator
  if (['contains', 'like'].includes(operator)) {
    formattedOperator = 'like'
    formattedValue = `%${value}%`
  } else if (['not_like', 'notlike'].includes(operator)) {
    formattedOperator = 'not like'
    formattedValue = `%${value}%`
  } else if (operator === 'equals') {
    formattedOperator = '='
  }

  if (pathSegments.length === 1) {
    return `EXISTS (SELECT 1 FROM json_each(${rootColumn ?? `"${sanitizePathSegment(pathSegments[0])}"`}) AS ${newAlias} WHERE ${newAlias}.value ${formattedOperator} '${formattedValue}')`
  }

  return `EXISTS (
  SELECT 1
  FROM json_each(${alias}.value -> '${sanitizePathSegment(pathSegments[0])}') AS ${newAlias}
  WHERE COALESCE(${newAlias}.value ->> '${sanitizePathSegment(pathSegments[1])}', '') ${formattedOperator} '${formattedValue}'
  )`
}

const createDateOnlyConstraint = ({
  column,
  operator,
  pathSegments,
  treatAsArray,
  value,
}: Pick<
  CreateJSONQueryArgs,
  'column' | 'operator' | 'pathSegments' | 'treatAsArray' | 'value'
>): string => {
  if (!column) {
    throw new Error('A JSON column is required for a date-only comparison')
  }

  const rootColumn = typeof column === 'string' ? column : `"${column.name}"`
  const alias = `${sanitizePathSegment(pathSegments[0])}_date_filter`
  const nestedPathSegments = pathSegments.slice(1)
  const buildPredicate = ({
    expression,
    pathIndex,
    terminalPredicate,
  }: {
    expression: string
    pathIndex: number
    terminalPredicate: (jsonValue: string) => string
  }): string => {
    const segment = nestedPathSegments[pathIndex]

    if (!segment) {
      throw new Error('A nested JSON date path is required')
    }

    const sanitizedSegment = sanitizePathSegment(segment)

    if (pathIndex === nestedPathSegments.length - 1) {
      return terminalPredicate(`json_extract(${expression}, '$.${sanitizedSegment}')`)
    }

    const nestedExpression = `json_extract(${expression}, '$.${sanitizedSegment}')`

    const nestedPath = nestedPathSegments.slice(0, pathIndex + 1).join('.')

    if (!treatAsArray?.includes(nestedPath)) {
      return buildPredicate({
        expression: nestedExpression,
        pathIndex: pathIndex + 1,
        terminalPredicate,
      })
    }

    const nestedAlias = `${alias}_${sanitizedSegment}_${pathIndex}`

    return `EXISTS (SELECT 1 FROM json_each(${nestedExpression}) AS ${nestedAlias} WHERE ${buildPredicate(
      {
        expression: `${nestedAlias}.value`,
        pathIndex: pathIndex + 1,
        terminalPredicate,
      },
    )})`
  }
  const createRootPredicate = (terminalPredicate: (jsonValue: string) => string): string =>
    `EXISTS (SELECT 1 FROM json_each(${rootColumn}) AS ${alias} WHERE ${buildPredicate({
      expression: `${alias}.value`,
      pathIndex: 0,
      terminalPredicate,
    })})`

  if (['date_equals', 'date_not_equals'].includes(operator)) {
    if (!Array.isArray(value) || typeof value[0] !== 'string' || typeof value[1] !== 'string') {
      throw new Error('Invalid date-only JSON comparison')
    }

    const predicate = createRootPredicate(
      (jsonValue) =>
        `julianday(${jsonValue}) >= julianday('${escapeSQLValue(value[0])}') AND julianday(${jsonValue}) < julianday('${escapeSQLValue(value[1])}')`,
    )

    return `${operator === 'date_not_equals' ? 'NOT ' : ''}${predicate}`
  }

  const operatorMap: Record<string, string> = {
    greater_than: '>',
    greater_than_equal: '>=',
    less_than: '<',
    less_than_equal: '<=',
  }
  const comparisonOperator = operatorMap[operator.slice(5)]

  if (!comparisonOperator || typeof value !== 'string') {
    throw new Error('Invalid date-only JSON comparison')
  }

  return createRootPredicate(
    (jsonValue) =>
      `julianday(${jsonValue}) ${comparisonOperator} julianday('${escapeSQLValue(value)}')`,
  )
}

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
  if (
    [
      'date_equals',
      'date_greater_than',
      'date_greater_than_equal',
      'date_less_than',
      'date_less_than_equal',
      'date_not_equals',
    ].includes(operator)
  ) {
    return createDateOnlyConstraint({ column, operator, pathSegments, treatAsArray, value })
  }

  if ((operator === 'in' || operator === 'not_in') && Array.isArray(value)) {
    let sql = ''
    for (const [i, v] of value.entries()) {
      sql = `${sql}${createJSONQuery({ column, operator: operator === 'in' ? 'equals' : 'not_equals', pathSegments, rawColumn, table, treatAsArray, treatRootAsArray, value: v })} ${i === value.length - 1 ? '' : ` ${operator === 'in' ? 'OR' : 'AND'} `}`
    }
    return `(${sql})`
  }

  if (treatAsArray?.includes(pathSegments[1]) && table) {
    return fromArray({
      operator,
      pathSegments,
      table,
      treatAsArray,
      value: value as CreateConstraintArgs['value'],
    })
  }

  return createConstraint({
    alias: table,
    operator,
    pathSegments,
    rootColumn: typeof column === 'string' ? column : column ? `"${column.name}"` : undefined,
    treatAsArray,
    value: value as CreateConstraintArgs['value'],
  })
}

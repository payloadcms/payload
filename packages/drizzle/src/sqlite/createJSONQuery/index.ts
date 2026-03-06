import type { CreateJSONQueryArgs } from '../../types.js'

import { escapeSQLValue } from '../../utilities/escapeSQLValue.js'

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
  const alias = `${pathSegments[isRoot ? 0 : 1]}_alias_${newPathSegments.length}`

  return `EXISTS (
    SELECT 1
    FROM json_each(${table}.${pathSegments[0]}) AS ${alias}
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
  treatAsArray?: string[]
  value: boolean | number | string
}

const createConstraint = ({
  alias,
  operator,
  pathSegments,
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
      return `EXISTS (SELECT 1 FROM json_each("${pathSegments[0]}") AS ${newAlias})`
    }

    return `EXISTS (
      SELECT 1
      FROM json_each(${alias}.value -> '${pathSegments[0]}') AS ${newAlias}
      WHERE ${newAlias}.key = '${pathSegments[1]}'
    )`
  }

  if (operator === 'not_exists') {
    if (pathSegments.length === 1) {
      return `NOT EXISTS (SELECT 1 FROM json_each("${pathSegments[0]}") AS ${newAlias})`
    }

    return `NOT EXISTS (
      SELECT 1
      FROM json_each(${alias}.value -> '${pathSegments[0]}') AS ${newAlias}
      WHERE ${newAlias}.key = '${pathSegments[1]}'
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
    return `EXISTS (SELECT 1 FROM json_each("${pathSegments[0]}") AS ${newAlias} WHERE ${newAlias}.value ${formattedOperator} '${formattedValue}')`
  }

  return `EXISTS (
  SELECT 1
  FROM json_each(${alias}.value -> '${pathSegments[0]}') AS ${newAlias}
  WHERE COALESCE(${newAlias}.value ->> '${pathSegments[1]}', '') ${formattedOperator} '${formattedValue}'
  )`
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
  if ((operator === 'in' || operator === 'not_in') && Array.isArray(value)) {
    let sql = ''
    for (const [i, v] of value.entries()) {
      sql = `${sql}${createJSONQuery({ column, operator: operator === 'in' ? 'equals' : 'not_equals', pathSegments, rawColumn, table, treatAsArray, treatRootAsArray, value: v })} ${i === value.length - 1 ? '' : ` ${operator === 'in' ? 'OR' : 'AND'} `}`
    }
    return sql
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
    treatAsArray,
    value: value as CreateConstraintArgs['value'],
  })
}

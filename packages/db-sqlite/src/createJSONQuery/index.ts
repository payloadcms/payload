import type { CreateJSONQueryArgs } from '@payloadcms/drizzle/types'

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
  let formattedValue = value
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

  return `EXISTS (
  SELECT 1
  FROM json_each(${alias}.value -> '${pathSegments[0]}') AS ${newAlias}
  WHERE COALESCE(${newAlias}.value ->> '${pathSegments[1]}', '') ${formattedOperator} '${formattedValue}'
  )`
}

export const createJSONQuery = ({
  operator,
  pathSegments,
  table,
  treatAsArray,
  value,
}: CreateJSONQueryArgs): string => {
  if (treatAsArray?.includes(pathSegments[1]!) && table) {
    return fromArray({
      operator,
      pathSegments,
      table,
      treatAsArray,
      value,
    })
  }

  return createConstraint({ alias: table, operator, pathSegments, treatAsArray, value })
}

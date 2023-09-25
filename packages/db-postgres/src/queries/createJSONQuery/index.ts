import { v4 as uuid } from 'uuid'

// TARGET:

// SELECT COUNT(*)
// FROM "rich_text_fields"
// WHERE EXISTS (
//   SELECT 1
//   FROM jsonb_array_elements(rich_text) AS rt
//   WHERE EXISTS (
//     SELECT 1
//     FROM jsonb_array_elements(rt -> 'children') AS child
//     WHERE child ->> 'text' ~* 'Hello'
//   )
// );

type FromArrayArgs = {
  operator: string
  pathSegments: string[]
  treatAsArray?: string[]
  value: unknown
}

const fromArray = (args: FromArrayArgs) => `EXISTS (
  SELECT 1
  FROM jsonb_array_elements(${args.pathSegments[0]}) AS ${uuid}
  ${createJSONQuery({
    ...args,
    pathSegments: args.pathSegments.slice(1),
  })}
)`

const createConstraint = (args) => ``

type Args = {
  operator: string
  pathSegments: string[]
  treatAsArray?: string[]
  treatRootAsArray?: boolean
  value: unknown
}

type CreateJSONQuery = ({ operator, pathSegments, treatAsArray, treatRootAsArray, value }) => string

export const createJSONQuery = ({
  operator,
  pathSegments,
  treatAsArray,
  treatRootAsArray,
  value,
}: Args): string => {
  if (treatRootAsArray) {
    return fromArray({
      operator,
      pathSegments,
      treatAsArray,
      value,
    })
  }

  if (treatAsArray.includes(pathSegments[0])) {
    return fromArray({
      operator,
      pathSegments,
      treatAsArray,
      value,
    })
  }

  return createConstraint()
}

// myNestedProperty.myArray.myGroup.myArray.text

import { GraphQLEnumType } from 'graphql'

function enumValues<T extends string>(values: readonly T[]): Record<T, { value: T }> {
  return values.reduce(
    (acc, value) => {
      acc[value] = { value }
      return acc
    },
    {} as Record<T, { value: T }>,
  )
}

export const GraphQLReadVersion = new GraphQLEnumType({
  name: 'ReadVersion',
  values: enumValues(['published', 'latest', 'draft'] as const),
})

export const GraphQLCreateAction = new GraphQLEnumType({
  name: 'CreateAction',
  values: enumValues(['publish', 'saveDraft'] as const),
})

export const GraphQLUpdateAction = new GraphQLEnumType({
  name: 'UpdateAction',
  values: enumValues(['publish', 'saveDraft', 'unpublish'] as const),
})

export const GraphQLRestoreAction = new GraphQLEnumType({
  name: 'RestoreAction',
  values: enumValues(['publish', 'saveDraft'] as const),
})

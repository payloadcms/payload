import type { GraphQLType } from 'graphql'
import type { FieldAffectingData } from 'payload'

import { GraphQLNonNull } from 'graphql'

export const withNullableType = ({
  type,
  field,
  forceNullable,
  parentIsLocalized,
}: {
  field: FieldAffectingData
  forceNullable?: boolean
  parentIsLocalized: boolean
  type: GraphQLType
}): GraphQLType => {
  const hasReadAccessControl = field.access && field.access.read
  const condition = field.admin && field.admin.condition
  const isTimestamp = field.name === 'createdAt' || field.name === 'updatedAt'
  // Virtual fields are computed by hooks, so they should be nullable in GraphQL inputs
  const isVirtual = 'virtual' in field && field.virtual === true

  if (
    !forceNullable &&
    'required' in field &&
    field.required &&
    (!field.localized || parentIsLocalized) &&
    !condition &&
    !hasReadAccessControl &&
    !isTimestamp &&
    !isVirtual
  ) {
    return new GraphQLNonNull(type)
  }

  return type
}

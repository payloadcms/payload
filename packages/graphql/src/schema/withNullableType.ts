import type { GraphQLType } from 'graphql'
import type { FieldAffectingData } from 'payload'

import { GraphQLNonNull } from 'graphql'
import { fieldIsVirtual } from 'payload/shared'

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
  // Virtual fields are computed (by hooks or from a linked relationship), so they must
  // not be non-null in the GraphQL schema even when marked required.
  const isVirtual = fieldIsVirtual(field)

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

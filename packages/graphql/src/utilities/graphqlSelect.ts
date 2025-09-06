import type { GraphQLObjectType, GraphQLResolveInfo } from 'graphql'
import type { FieldBase, JoinField, RelationshipField, UploadField } from 'payload'

import graphqlFields from 'graphql-fields'

export function graphqlSelectFromCollection(info: GraphQLResolveInfo) {
  return buildSelect(graphqlFields(info), info)
}
export function graphqlSelectFromCollectionMany(info: GraphQLResolveInfo) {
  return buildSelect(graphqlFields(info).docs, info)
}
export function graphqlSelectFromField(
  field: JoinField | RelationshipField | UploadField,
  info: GraphQLResolveInfo,
) {
  switch (field.type) {
    case 'join':
      return buildSelect(graphqlFields(info).docs, info)
    case 'relationship':
      return Array.isArray(field.relationTo)
        ? buildSelect(graphqlFields(info).value, info)
        : buildSelect(graphqlFields(info), info)
    case 'upload':
      return buildSelect(graphqlFields(info), info)
  }
}

function buildSelect(fields: object, info: GraphQLResolveInfo) {
  const type = info.schema.getType(info.fieldName) as GraphQLObjectType
  const typeFields = type?.getFields()

  return (
    type &&
    Object.keys(fields)
      .map((field) => (typeFields[field]?.extensions?.field as FieldBase)?.name || field)
      .reduce(
        (acc, key) => {
          acc[key] = true
          return acc
        },
        {} as Record<string, true>,
      )
  )
}

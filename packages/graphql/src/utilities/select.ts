import type { GraphQLObjectType, GraphQLResolveInfo, SelectionSetNode } from 'graphql'
import type { FieldBase, JoinField, RelationshipField, TypedCollectionSelect } from 'payload'

import { getNamedType, isInterfaceType, isObjectType, isUnionType, Kind } from 'graphql'

export function buildSelectForCollection(info: GraphQLResolveInfo): SelectType {
  return buildSelect(info)
}
export function buildSelectForCollectionMany(info: GraphQLResolveInfo): SelectType {
  return buildSelect(info).docs as SelectType
}

export function resolveSelect(info: GraphQLResolveInfo, select: SelectType): SelectType {
  if (select) {
    const traversePath: string[] = []
    const traverseTree = (path: GraphQLResolveInfo['path']) => {
      const pathKey = path.key
      const pathType = info.schema.getType(path.typename) as GraphQLObjectType

      if (pathType) {
        const field = pathType?.getFields()?.[pathKey]?.extensions?.field as
          | JoinField
          | RelationshipField

        if (field?.type === 'join') {
          path = path.prev
          traversePath.unshift('docs')
        }
        if (field?.type === 'relationship' && Array.isArray(field.relationTo)) {
          path = path.prev
          traversePath.unshift('value')
        }
        if (field) {
          traversePath.unshift(field.name)
        }
      }

      if (path.prev) {
        traverseTree(path.prev)
      }
    }

    traverseTree(info.path)
    traversePath.forEach((key) => {
      select = select?.[key] as SelectType
    })
  }

  return select
}

function buildSelect(info: GraphQLResolveInfo) {
  const returnType = getNamedType(info.returnType) as GraphQLObjectType
  const selectionSet = info.fieldNodes[0].selectionSet

  if (!returnType) {
    return
  }

  return buildSelectTree(info, selectionSet, returnType)
}
function buildSelectTree(
  info: GraphQLResolveInfo,
  selectionSet: SelectionSetNode,
  type: GraphQLObjectType,
): SelectType {
  const fieldMap = type.getFields?.()
  const fieldTree: SelectType = {}

  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case Kind.FIELD: {
        const fieldName = selection.name.value
        const fieldSchema = fieldMap?.[fieldName]

        const field = fieldSchema?.extensions?.field as FieldBase
        const fieldNameOriginal = field?.name || fieldName

        if (fieldName === '__typename') {
          continue
        }
        if (fieldSchema == undefined) {
          continue
        }

        if (selection.selectionSet) {
          const type = getNamedType(fieldSchema.type) as GraphQLObjectType

          if (isObjectType(type) || isInterfaceType(type) || isUnionType(type)) {
            fieldTree[fieldNameOriginal] = buildSelectTree(info, selection.selectionSet, type)
            continue
          }
        }

        fieldTree[fieldNameOriginal] = true
        break
      }

      case Kind.FRAGMENT_SPREAD: {
        const fragmentName = selection.name.value
        const fragment = info.fragments[fragmentName]
        const fragmentType =
          fragment && (info.schema.getType(fragment.typeCondition.name.value) as GraphQLObjectType)

        if (fragmentType) {
          Object.assign(fieldTree, buildSelectTree(info, fragment.selectionSet, fragmentType))
        }
        break
      }

      case Kind.INLINE_FRAGMENT: {
        const fragmentType = selection.typeCondition
          ? (info.schema.getType(selection.typeCondition.name.value) as GraphQLObjectType)
          : type

        if (fragmentType) {
          // Block types in unions need selections nested under their slug
          const blockSlug = fragmentType.extensions?.blockSlug as string | undefined

          if (blockSlug && isUnionType(type)) {
            fieldTree[blockSlug] = buildSelectTree(info, selection.selectionSet, fragmentType)
          } else {
            Object.assign(fieldTree, buildSelectTree(info, selection.selectionSet, fragmentType))
          }
        }
        break
      }
    }
  }

  return fieldTree
}

type SelectType = TypedCollectionSelect['any']

import type { GraphQLObjectType, GraphQLResolveInfo, SelectionSetNode } from 'graphql'
import type {
  FieldBase,
  JoinField,
  RelationshipField,
  SelectIncludeType,
  TypedCollectionSelect,
  UploadField,
} from 'payload'

import { getNamedType, isInterfaceType, isObjectType, isUnionType, Kind } from 'graphql'

import type { Context } from '../resolvers/types.js'

type SelectRootPathsByOperation = WeakMap<
  GraphQLResolveInfo['operation'],
  Set<GraphQLResolveInfo['path']['key']>
>

const selectRootPathsByContext = new WeakMap<Context, SelectRootPathsByOperation>()

export function buildSelectForCollection(info: GraphQLResolveInfo, context?: Context): SelectType {
  if (context) {
    registerSelectRootPath(context, info)
  }

  return buildSelect(info)
}
export function buildSelectForCollectionMany(
  info: GraphQLResolveInfo,
  context?: Context,
): SelectType {
  if (context) {
    registerSelectRootPath(context, info)
  }

  return buildSelect(info)?.docs as SelectType
}

export function resolveSelect(
  info: GraphQLResolveInfo,
  select: SelectType,
  context?: Context,
): SelectType {
  const isSelectEnabled = context ? hasSelectRootPath(context, info) : typeof select !== 'undefined'

  if (!isSelectEnabled) {
    return undefined
  }

  const field = info.parentType.getFields()[info.fieldName]?.extensions?.field as
    | JoinField
    | RelationshipField
    | undefined
    | UploadField
  const fieldSelect = buildSelect(info)

  if (field?.type === 'join') {
    return fieldSelect?.docs as SelectType
  }

  if (
    (field?.type === 'relationship' || field?.type === 'upload') &&
    Array.isArray(field.relationTo)
  ) {
    return fieldSelect?.value as SelectType
  }

  return fieldSelect
}

function buildSelect(info: GraphQLResolveInfo) {
  const returnType = getNamedType(info.returnType) as GraphQLObjectType

  if (!returnType) {
    return
  }

  return info.fieldNodes.reduce<SelectTree>((fieldTree, fieldNode) => {
    if (!fieldNode.selectionSet) {
      return fieldTree
    }

    return mergeSelectTrees(fieldTree, buildSelectTree(info, fieldNode.selectionSet, returnType))
  }, {})
}

function buildSelectTree(
  info: GraphQLResolveInfo,
  selectionSet: SelectionSetNode,
  type: GraphQLObjectType,
): SelectTree {
  const fieldMap = type.getFields?.()
  let fieldTree: SelectTree = {}

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
            fieldTree = mergeSelectTrees(fieldTree, {
              [fieldNameOriginal]: buildSelectTree(info, selection.selectionSet, type),
            })
            continue
          }
        }

        fieldTree = mergeSelectTrees(fieldTree, { [fieldNameOriginal]: true })
        break
      }

      case Kind.FRAGMENT_SPREAD: {
        const fragmentName = selection.name.value
        const fragment = info.fragments[fragmentName]
        const fragmentType =
          fragment && (info.schema.getType(fragment.typeCondition.name.value) as GraphQLObjectType)

        if (fragmentType) {
          fieldTree = mergeSelectTrees(
            fieldTree,
            buildFragmentSelectTree(info, fragment.selectionSet, fragmentType, type),
          )
        }
        break
      }

      case Kind.INLINE_FRAGMENT: {
        const fragmentType = selection.typeCondition
          ? (info.schema.getType(selection.typeCondition.name.value) as GraphQLObjectType)
          : type

        if (fragmentType) {
          fieldTree = mergeSelectTrees(
            fieldTree,
            buildFragmentSelectTree(info, selection.selectionSet, fragmentType, type),
          )
        }
        break
      }
    }
  }

  return fieldTree
}

function buildFragmentSelectTree(
  info: GraphQLResolveInfo,
  selectionSet: SelectionSetNode,
  fragmentType: GraphQLObjectType,
  parentType: GraphQLObjectType,
): SelectTree {
  const fragmentSelectTree = buildSelectTree(info, selectionSet, fragmentType)
  const blockSlug = fragmentType.extensions?.blockSlug as string | undefined

  if (blockSlug && isUnionType(parentType)) {
    return { [blockSlug]: fragmentSelectTree }
  }

  return fragmentSelectTree
}

function getRootPathKey(path: GraphQLResolveInfo['path']): GraphQLResolveInfo['path']['key'] {
  while (path.prev) {
    path = path.prev
  }

  return path.key
}

function hasSelectRootPath(context: Context, info: GraphQLResolveInfo): boolean {
  return Boolean(
    selectRootPathsByContext.get(context)?.get(info.operation)?.has(getRootPathKey(info.path)),
  )
}

function isSelectTree(value: unknown): value is SelectTree {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeSelectTrees(firstTree: SelectTree, secondTree: SelectTree): SelectTree {
  const mergedTree = { ...firstTree }

  for (const [fieldName, fieldSelect] of Object.entries(secondTree)) {
    const existingFieldSelect = mergedTree[fieldName]

    mergedTree[fieldName] =
      isSelectTree(existingFieldSelect) && isSelectTree(fieldSelect)
        ? mergeSelectTrees(existingFieldSelect, fieldSelect)
        : fieldSelect
  }

  return mergedTree
}

function registerSelectRootPath(context: Context, info: GraphQLResolveInfo): void {
  let selectRootPathsByOperation = selectRootPathsByContext.get(context)

  if (!selectRootPathsByOperation) {
    selectRootPathsByOperation = new WeakMap()
    selectRootPathsByContext.set(context, selectRootPathsByOperation)
  }

  let selectRootPaths = selectRootPathsByOperation.get(info.operation)

  if (!selectRootPaths) {
    selectRootPaths = new Set()
    selectRootPathsByOperation.set(info.operation, selectRootPaths)
  }

  selectRootPaths.add(getRootPathKey(info.path))
}

type SelectTree = SelectIncludeType
type SelectType = TypedCollectionSelect['any']

import { buildJoinScopeWhere } from './buildJoinScopeWhere.js'
import { getValueAtPath } from './getValueAtPath.js'

/**
 * Builds a join-scope filter for order key generation during beforeChange.
 */
export function getJoinScopeWhereFromDocData(args: {
  collectionSlug: string
  data: Record<string, unknown>
  joinFieldPathsByCollection?: Map<string, Map<string, string>>
  orderableFieldName: string
  originalDoc?: Record<string, unknown>
}): ReturnType<typeof buildJoinScopeWhere> {
  const { collectionSlug, data, joinFieldPathsByCollection, orderableFieldName, originalDoc } = args

  const joinOnFieldPath = joinFieldPathsByCollection?.get(collectionSlug)?.get(orderableFieldName)

  if (!joinOnFieldPath) {
    return null
  }

  const scopeValue =
    getValueAtPath(data, joinOnFieldPath) ?? getValueAtPath(originalDoc, joinOnFieldPath)

  return buildJoinScopeWhere({
    joinOnFieldPath,
    scopeValue,
  })
}

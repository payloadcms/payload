import type { PayloadHandler } from '../../types.js'

import { buildJoinScopeWhere } from './buildJoinScopeWhere.js'
import { getValueAtPath } from './getValueAtPath.js'

/**
 * Resolves join scope and target document context for reorder operations.
 */
export async function getJoinScopeContext(args: {
  collectionSlug: string
  joinFieldPathsByCollection: Map<string, Map<string, string>>
  orderableFieldName: string
  req: Parameters<PayloadHandler>[0]
  target: unknown
}): Promise<{
  joinScopeWhere: ReturnType<typeof buildJoinScopeWhere>
  targetDoc: null | Record<string, unknown>
}> {
  const { collectionSlug, joinFieldPathsByCollection, orderableFieldName, req, target } = args

  const joinOnFieldPath = joinFieldPathsByCollection.get(collectionSlug)?.get(orderableFieldName)
  let targetDoc: null | Record<string, unknown> = null

  if (
    typeof target === 'object' &&
    target &&
    'id' in target &&
    (joinOnFieldPath || ('key' in target && target.key === 'pending'))
  ) {
    const targetID = (target as { id?: unknown }).id

    if (typeof targetID === 'number' || typeof targetID === 'string') {
      targetDoc = await req.payload.findByID({
        id: targetID,
        collection: collectionSlug,
        depth: 0,
        select: {
          ...(joinOnFieldPath ? { [joinOnFieldPath]: true } : {}),
          [orderableFieldName]: true,
        },
      })
    }
  }

  if (!joinOnFieldPath) {
    return {
      joinScopeWhere: null,
      targetDoc,
    }
  }

  const joinScopeValue = getValueAtPath(targetDoc, joinOnFieldPath)

  return {
    joinScopeWhere: buildJoinScopeWhere({
      joinOnFieldPath,
      scopeValue: joinScopeValue,
    }),
    targetDoc,
  }
}

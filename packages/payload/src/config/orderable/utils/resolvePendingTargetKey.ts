import type { PayloadHandler } from '../../types.js'

/**
 * Resolves the target key when the client sends the temporary `pending` marker.
 */
export async function resolvePendingTargetKey(args: {
  collectionSlug: string
  orderableFieldName: string
  req: Parameters<PayloadHandler>[0]
  targetDoc: null | Record<string, unknown>
  targetID: string
  targetKey: string
}): Promise<null | string> {
  const { collectionSlug, orderableFieldName, req, targetDoc, targetID, targetKey } = args

  if (targetKey !== 'pending') {
    return targetKey
  }

  const targetDocKey = targetDoc?.[orderableFieldName]
  if (typeof targetDocKey === 'string') {
    return targetDocKey
  }

  const beforeDoc = await req.payload.findByID({
    id: targetID,
    collection: collectionSlug,
    depth: 0,
    select: { [orderableFieldName]: true },
  })

  return beforeDoc?.[orderableFieldName] || null
}

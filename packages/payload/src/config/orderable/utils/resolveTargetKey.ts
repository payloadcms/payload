import type { PayloadRequest } from '../../../types/index.js'

/**
 * Resolves the effective target key, handling the "pending" UI placeholder by
 * reading the current persisted key from the database.
 */
export async function resolveTargetKey(args: {
  collectionSlug: string
  orderableFieldName: string
  req: PayloadRequest
  targetId: string
  targetKey: null | string | undefined
  targetKeyFromDoc?: null | string
}): Promise<null | string> {
  const { collectionSlug, orderableFieldName, req, targetId, targetKey, targetKeyFromDoc } = args

  if (targetKey !== 'pending') {
    return targetKey || null
  }

  if (typeof targetKeyFromDoc !== 'undefined') {
    return targetKeyFromDoc
  }

  const targetDoc = await req.payload.findByID({
    id: targetId,
    collection: collectionSlug,
    depth: 0,
    select: { [orderableFieldName]: true },
  })

  return targetDoc?.[orderableFieldName] || null
}

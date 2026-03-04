import type { PayloadRequest } from '../../../types/index.js'

/**
 * Finds the adjacent key around a target key to generate fractional order keys
 * between target and its nearest neighbor in the requested direction.
 */
export async function findAdjacentDocKey(args: {
  collectionSlug: string
  joinScopeWhere?: null | Record<string, unknown>
  newKeyWillBe: 'greater' | 'less'
  orderableFieldName: string
  req: PayloadRequest
  targetKey: null | string
}): Promise<null | string> {
  const { collectionSlug, joinScopeWhere, newKeyWillBe, orderableFieldName, req, targetKey } = args

  const adjacentDoc = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    limit: 1,
    pagination: false,
    select: { [orderableFieldName]: true },
    sort: newKeyWillBe === 'greater' ? orderableFieldName : `-${orderableFieldName}`,
    where: {
      and: [
        {
          [orderableFieldName]: {
            [newKeyWillBe === 'greater' ? 'greater_than' : 'less_than']: targetKey,
          },
        },
        ...(joinScopeWhere ? [joinScopeWhere] : []),
      ],
    },
  })

  return adjacentDoc.docs?.[0]?.[orderableFieldName] || null
}

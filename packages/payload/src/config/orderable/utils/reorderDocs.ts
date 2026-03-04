import type { PayloadRequest } from '../../../types/index.js'

import { generateNKeysBetween } from '../fractional-indexing.js'

/**
 * Assigns new fractional order keys to moved docs and persists the updates.
 */
export async function reorderDocs(args: {
  adjacentDocKey: null | string
  collectionSlug: string
  docsToMove: string[]
  newKeyWillBe: 'greater' | 'less'
  orderableFieldName: string
  req: PayloadRequest
  targetKey: null | string
}): Promise<string[]> {
  const {
    adjacentDocKey,
    collectionSlug,
    docsToMove,
    newKeyWillBe,
    orderableFieldName,
    req,
    targetKey,
  } = args

  const orderValues =
    newKeyWillBe === 'greater'
      ? generateNKeysBetween(targetKey, adjacentDocKey, docsToMove.length)
      : generateNKeysBetween(adjacentDocKey, targetKey, docsToMove.length)

  for (const [index, id] of docsToMove.entries()) {
    await req.payload.update({
      id,
      collection: collectionSlug,
      data: {
        [orderableFieldName]: orderValues[index],
      },
      depth: 0,
      req,
    })
  }

  return orderValues
}

import type { Endpoint, PayloadHandler } from '../../config/types.js'
import type { PayloadRequest, SanitizedCollectionConfig } from '../../index.js'

import { APIError, executeAccess } from '../../index.js'
import { generateNKeysBetween } from '../../utilities/fractional-indexing.js'
import { ORDER_FIELD_NAME } from '../config/sanitizeOrderable.js'

export const getReorderEndpoint = (
  collection: SanitizedCollectionConfig,
): Omit<Endpoint, 'root'> => {
  const reorderHandler: PayloadHandler = async (req: PayloadRequest) => {
    if (!req.json) {
      throw new APIError('Unreachable')
    }
    const body = await req.json()
    type KeyAndID = {
      id: string
      key: string
    }
    const { docsToMove, newKeyWillBe, target } = body as {
      // array of docs IDs to be moved before or after the target
      docsToMove: string[]
      // new key relative to the target. We don't use "after" or "before" as
      // it can be misleading if the table is sorted in descending order.
      newKeyWillBe: 'greater' | 'less'
      target: KeyAndID
    }

    if (!Array.isArray(docsToMove) || docsToMove.length === 0) {
      return new Response(JSON.stringify({ error: 'docsToMove must be a non-empty array' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    if (
      typeof target !== 'object' ||
      typeof target.id !== 'string' ||
      typeof target.key !== 'string'
    ) {
      return new Response(JSON.stringify({ error: 'target must be an object with id and key' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    if (newKeyWillBe !== 'greater' && newKeyWillBe !== 'less') {
      return new Response(JSON.stringify({ error: 'newKeyWillBe must be "greater" or "less"' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Prevent reordering if user doesn't have editing permissions
    await executeAccess(
      {
        // Currently only one doc can be moved at a time. We should review this if we want to allow
        // multiple docs to be moved at once in the future.
        id: docsToMove[0],
        data: {},
        req,
      },
      collection.access.update,
    )

    const targetId = target.id
    let targetKey: null | string = target.key

    // If targetKey = pending, we need to find its current key.
    // This can only happen if the user reorders rows quickly with a slow connection.
    if (targetKey === 'pending') {
      const beforeDoc = await req.payload.findByID({
        id: targetId,
        collection: collection.slug,
        depth: 0,
        select: { [ORDER_FIELD_NAME]: true },
      })
      targetKey = (beforeDoc?.[ORDER_FIELD_NAME] as string) || null
    }

    // The reason the endpoint does not receive this docId as an argument is that there
    // are situations where the user may not see or know what the next or previous one is. For
    // example, access control restrictions, if docBefore is the last one on the page, etc.
    const adjacentDoc = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      limit: 1,
      pagination: false,
      select: { [ORDER_FIELD_NAME]: true },
      sort: newKeyWillBe === 'greater' ? ORDER_FIELD_NAME : `-${ORDER_FIELD_NAME}`,
      where: {
        [ORDER_FIELD_NAME]: {
          [newKeyWillBe === 'greater' ? 'greater_than' : 'less_than']: targetKey,
        },
      },
    })
    const adjacentDocKey: null | string =
      (adjacentDoc.docs?.[0]?.[ORDER_FIELD_NAME] as string) || null

    // Currently N (= docsToMove.length) is always 1. Maybe in the future we will
    // allow dragging and reordering multiple documents at once via the UI.
    const orderValues =
      newKeyWillBe === 'greater'
        ? generateNKeysBetween(targetKey, adjacentDocKey, docsToMove.length)
        : generateNKeysBetween(adjacentDocKey, targetKey, docsToMove.length)

    // Update each document with its new order value

    for (const id of docsToMove) {
      await req.payload.update({
        id,
        collection: collection.slug,
        data: {
          [ORDER_FIELD_NAME]: orderValues.shift(),
        },
        depth: 0,
        req,
        select: { [ORDER_FIELD_NAME]: true },
      })
    }

    return new Response(JSON.stringify({ orderValues, success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  return {
    handler: reorderHandler,
    method: 'post',
    path: '/reorder',
  }
}

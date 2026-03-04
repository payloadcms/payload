import type { BeforeChangeHook, CollectionConfig } from '../../../collections/config/types.js'

import { generateKeyBetween } from '../fractional-indexing.js'
import { buildJoinScopeWhere } from './buildJoinScopeWhere.js'
import { getValueAtPath } from './getValueAtPath.js'

/**
 * Creates a `beforeChange` hook that assigns initial order keys for newly
 * created docs that do not yet have order values.
 */
export function createOrderBeforeChangeHook(args: {
  collection: CollectionConfig
  orderableFields: Array<{
    joinOnFieldPath?: string
    name: string
  }>
}): BeforeChangeHook {
  const { collection, orderableFields } = args

  return async ({ data, originalDoc, req }) => {
    for (const { name: orderableFieldName, joinOnFieldPath } of orderableFields) {
      if (!data[orderableFieldName] && !originalDoc?.[orderableFieldName]) {
        const scopeValue = joinOnFieldPath
          ? (getValueAtPath(data, joinOnFieldPath) ?? getValueAtPath(originalDoc, joinOnFieldPath))
          : undefined
        const joinScopeWhere = joinOnFieldPath
          ? buildJoinScopeWhere({
              joinOnFieldPath,
              scopeValue,
            })
          : null

        const lastDoc = await req.payload.find({
          collection: collection.slug,
          depth: 0,
          limit: 1,
          pagination: false,
          req,
          select: { [orderableFieldName]: true },
          sort: `-${orderableFieldName}`,
          where: {
            and: [
              {
                [orderableFieldName]: {
                  exists: true,
                },
              },
              ...(joinScopeWhere ? [joinScopeWhere] : []),
            ],
          },
        })

        const lastOrderValue = lastDoc.docs[0]?.[orderableFieldName] || null
        data[orderableFieldName] = generateKeyBetween(lastOrderValue, null)
      }
    }

    return data
  }
}

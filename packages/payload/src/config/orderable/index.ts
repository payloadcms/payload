import type { BeforeChangeHook, CollectionConfig } from '../../collections/config/types.js'
import type { Endpoint, PayloadHandler, SanitizedConfig } from '../types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { buildJoinScopeWhere } from './utils/buildJoinScopeWhere.js'
import {
  buildOrderableFieldsMap,
  type OrderableFieldConfig,
} from './utils/buildOrderableFieldsMap.js'
import { createJSONResponse } from './utils/createJSONResponse.js'
import { createOrderBeforeChangeHook } from './utils/createOrderBeforeChangeHook.js'
import { createOrderField } from './utils/createOrderField.js'
import { findAdjacentDocKey } from './utils/findAdjacentDocKey.js'
import { getValueAtPath } from './utils/getValueAtPath.js'
import { reorderDocs } from './utils/reorderDocs.js'
import { resolveTargetKey } from './utils/resolveTargetKey.js'
import { runInitialOrderMigration } from './utils/runInitialOrderMigration.js'
import { validateReorderRequest } from './utils/validateReorderRequest.js'

/**
 * This function creates:
 * - N fields per collection, named `_order` or `_<collection>_<joinField>_order`
 * - 1 hook per collection
 * - 1 endpoint per app
 *
 * Also, if collection.defaultSort or joinField.defaultSort is not set, it will be set to the orderable field.
 */
export const setupOrderable = (config: SanitizedConfig) => {
  const { fieldsToAdd, joinFieldPathsByCollection } = buildOrderableFieldsMap(config)

  Array.from(fieldsToAdd.entries()).forEach(([collection, orderableFields]) => {
    addOrderableFieldsAndHook(collection, orderableFields)
  })

  if (fieldsToAdd.size > 0) {
    addOrderableEndpoint(config, joinFieldPathsByCollection)
  }
}

export const addOrderableFieldsAndHook = (
  collection: CollectionConfig,
  orderableFields: OrderableFieldConfig[],
) => {
  // 1. Add field
  orderableFields.forEach(({ name: orderableFieldName }) => {
    collection.fields.unshift(createOrderField(orderableFieldName))
  })

  // 2. Add hook
  if (!collection.hooks) {
    collection.hooks = {}
  }
  if (!collection.hooks.beforeChange) {
    collection.hooks.beforeChange = []
  }

  const orderBeforeChangeHook: BeforeChangeHook = createOrderBeforeChangeHook({
    collection,
    orderableFields,
  })

  collection.hooks.beforeChange.push(orderBeforeChangeHook)
}

/**
 * The body of the reorder endpoint.
 * @internal
 */
export type OrderableEndpointBody = {
  collectionSlug: string
  docsToMove: string[]
  newKeyWillBe: 'greater' | 'less'
  orderableFieldName: string
  target: {
    id: string
    key: string
  }
}

export const addOrderableEndpoint = (
  config: SanitizedConfig,
  joinFieldPathsByCollection: Map<string, Map<string, string>>,
) => {
  // 3. Add endpoint
  const reorderHandler: PayloadHandler = async (req) => {
    const body = await req.json?.()

    const validation = validateReorderRequest({ body, config })
    if ('errorResponse' in validation) {
      return validation.errorResponse
    }
    const { collection, collectionSlug, docsToMove, newKeyWillBe, orderableFieldName, target } =
      validation

    const joinOnFieldPath = joinFieldPathsByCollection.get(collection.slug)?.get(orderableFieldName)
    let joinScopeWhere: null | Record<string, unknown> = null
    let targetDoc: null | Record<string, unknown> = null

    if (joinOnFieldPath || target.key === 'pending') {
      targetDoc = await req.payload.findByID({
        id: target.id,
        collection: collection.slug,
        depth: 0,
        select: {
          ...(joinOnFieldPath ? { [joinOnFieldPath]: true } : {}),
          [orderableFieldName]: true,
        },
      })
    }

    if (joinOnFieldPath) {
      const joinScopeValue = getValueAtPath(targetDoc, joinOnFieldPath)
      joinScopeWhere = buildJoinScopeWhere({
        joinOnFieldPath,
        scopeValue: joinScopeValue,
      })
    }

    // Prevent reordering if user doesn't have editing permissions
    if (collection.access?.update) {
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
    }
    /**
     * If there is no target.key, we can assume the user enabled `orderable`
     * on a collection with existing documents, and that this is the first
     * time they tried to reorder them. Therefore, we perform a one-time
     * migration by setting the key value for all documents. We do this
     * instead of enforcing `required` and `unique` at the database schema
     * level, so that users don't have to run a migration when they enable
     * `orderable` on a collection with existing documents.
     */
    if (!target.key) {
      return runInitialOrderMigration({
        collectionSlug,
        orderableFieldName,
        req,
        where: {
          and: [
            {
              [orderableFieldName]: {
                exists: false,
              },
            },
            ...(joinScopeWhere ? [joinScopeWhere] : []),
          ],
        },
      })
    }

    const targetId = target.id
    const targetKeyFromDoc =
      typeof targetDoc?.[orderableFieldName] === 'string' ? targetDoc[orderableFieldName] : null
    const targetKey = await resolveTargetKey({
      collectionSlug,
      orderableFieldName,
      req,
      targetId,
      targetKey: target.key,
      targetKeyFromDoc,
    })

    // The reason the endpoint does not receive this docId as an argument is that there
    // are situations where the user may not see or know what the next or previous one is. For
    // example, access control restrictions, if docBefore is the last one on the page, etc.
    const adjacentDocKey = await findAdjacentDocKey({
      collectionSlug,
      joinScopeWhere,
      newKeyWillBe,
      orderableFieldName,
      req,
      targetKey,
    })

    // Currently N (= docsToMove.length) is always 1. Maybe in the future we will
    // allow dragging and reordering multiple documents at once via the UI.
    const orderValues = await reorderDocs({
      adjacentDocKey,
      collectionSlug,
      docsToMove,
      newKeyWillBe,
      orderableFieldName,
      req,
      targetKey,
    })

    return createJSONResponse({ orderValues, success: true }, 200)
  }

  const reorderEndpoint: Endpoint = {
    handler: reorderHandler,
    method: 'post',
    path: '/reorder',
  }

  if (!config.endpoints) {
    config.endpoints = []
  }

  config.endpoints.push(reorderEndpoint)
}

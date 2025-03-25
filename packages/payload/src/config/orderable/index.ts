import type { BeforeChangeHook, CollectionConfig } from '../../collections/config/types.js'
import type { Field, JoinField } from '../../fields/config/types.js'
import type { Endpoint, PayloadHandler, SanitizedConfig } from '../types.js'

import executeAccess from '../../auth/executeAccess.js'
import { flattenAllFields2 } from '../../utilities/flattenAllFields.js'
import { generateKeyBetween, generateNKeysBetween } from './fractional-indexing.js'

/**
 * This function creates:
 * - N fields per collection, named `_order` or `_<collection>_<joinField>_order`
 * - 1 hook per collection
 * - 1 endpoint per app
 *
 * Also, if collection.defaultSort or joinField.defaultSort is not set, it will be set to the orderable field.
 */
export const setupOrderable = (config: SanitizedConfig) => {
  let atLeastOneOrderableField = false
  const fieldsToAdd = new Map<CollectionConfig, string[]>()

  config.collections.forEach((collection) => {
    if (collection.orderable) {
      const currentFields = fieldsToAdd.get(collection) || []
      fieldsToAdd.set(collection, [...currentFields, '_order'])
      collection.defaultSort = collection.defaultSort ?? '_order'
    }
    const flattenedFields = flattenAllFields2(collection.fields)
    flattenedFields
      .filter((field): field is JoinField => field.type === 'join' && field.orderable === true)
      .forEach((field) => {
        if (Array.isArray(field.collection)) {
          throw new Error('Orderable joins must target a single collection')
        }
        const relationshipCollection = config.collections.find((c) => c.slug === field.collection)
        if (!relationshipCollection) {
          throw new Error(
            `Join field ${field.name} targets non-existent collection ${field.collection}`,
          )
        }
        field.defaultSort = field.defaultSort ?? `_${field.collection}_${field.name}_order`
        const currentFields = fieldsToAdd.get(relationshipCollection) || []
        fieldsToAdd.set(relationshipCollection, [
          ...currentFields,
          `_${field.collection}_${field.name}_order`,
        ])
      })
  })
  Array.from(fieldsToAdd.entries()).forEach(([collection, orderableFields]) => {
    if (orderableFields.length > 0) {
      addOrderableFieldsAndHook(collection, orderableFields)
      atLeastOneOrderableField = true
    }
  })

  if (atLeastOneOrderableField) {
    addOrderableEndpoint(config)
  }
}

export const addOrderableFieldsAndHook = (
  collection: CollectionConfig,
  orderableFieldNames: string[],
) => {
  // 1. Add field
  orderableFieldNames.forEach((orderableFieldName) => {
    const orderField: Field = {
      name: orderableFieldName,
      type: 'text',
      admin: {
        disableBulkEdit: true,
        disabled: true,
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
        readOnly: true,
      },
      index: true,
      required: true,
      unique: true,
    }

    collection.fields.unshift(orderField)
  })

  // 2. Add hook
  if (!collection.hooks) {
    collection.hooks = {}
  }
  if (!collection.hooks.beforeChange) {
    collection.hooks.beforeChange = []
  }

  const orderBeforeChangeHook: BeforeChangeHook = async ({ data, operation, req }) => {
    // Only set _order on create, not on update (unless explicitly provided)
    if (operation === 'create') {
      await Promise.all(
        orderableFieldNames.map(async (orderableFieldName) => {
          const lastDoc = await req.payload.find({
            collection: collection.slug,
            depth: 0,
            limit: 1,
            sort: `-${orderableFieldName}`,
          })

          const lastOrderValue = lastDoc.docs[0]?.[orderableFieldName] || null
          data[orderableFieldName] = generateKeyBetween(lastOrderValue, null)
        }),
      )
    }

    return data
  }

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

export const addOrderableEndpoint = (config: SanitizedConfig) => {
  // 3. Add endpoint
  const reorderHandler: PayloadHandler = async (req) => {
    const body = (await req.json?.()) as OrderableEndpointBody

    const { collectionSlug, docsToMove, newKeyWillBe, orderableFieldName, target } = body

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
    const collection = config.collections.find((c) => c.slug === collectionSlug)
    if (!collection) {
      return new Response(JSON.stringify({ error: `Collection ${collectionSlug} not found` }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    if (typeof orderableFieldName !== 'string') {
      return new Response(JSON.stringify({ error: 'orderableFieldName must be a string' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
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

    const targetId = target.id
    let targetKey = target.key

    // If targetKey = pending, we need to find its current key.
    // This can only happen if the user reorders rows quickly with a slow connection.
    if (targetKey === 'pending') {
      const beforeDoc = await req.payload.findByID({
        id: targetId,
        collection: collection.slug,
      })
      targetKey = beforeDoc?.[orderableFieldName] || null
    }

    // The reason the endpoint does not receive this docId as an argument is that there
    // are situations where the user may not see or know what the next or previous one is. For
    // example, access control restrictions, if docBefore is the last one on the page, etc.
    const adjacentDoc = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      limit: 1,
      sort: newKeyWillBe === 'greater' ? orderableFieldName : `-${orderableFieldName}`,
      where: {
        [orderableFieldName]: {
          [newKeyWillBe === 'greater' ? 'greater_than' : 'less_than']: targetKey,
        },
      },
    })
    const adjacentDocKey = adjacentDoc.docs?.[0]?.[orderableFieldName] || null

    // Currently N (= docsToMove.length) is always 1. Maybe in the future we will
    // allow dragging and reordering multiple documents at once via the UI.
    const orderValues =
      newKeyWillBe === 'greater'
        ? generateNKeysBetween(targetKey, adjacentDocKey, docsToMove.length)
        : generateNKeysBetween(adjacentDocKey, targetKey, docsToMove.length)

    // Update each document with its new order value
    const updatePromises = docsToMove.map((id, index) => {
      return req.payload.update({
        id,
        collection: collection.slug,
        data: {
          [orderableFieldName]: orderValues[index],
        },
      })
    })

    await Promise.all(updatePromises)

    return new Response(JSON.stringify({ orderValues, success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
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

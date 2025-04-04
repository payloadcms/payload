import type { BeforeChangeHook, CollectionConfig } from '../../collections/config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { Endpoint, PayloadHandler, SanitizedConfig } from '../types.js'

import executeAccess from '../../auth/executeAccess.js'
import { traverseFields } from '../../utilities/traverseFields.js'
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
  const fieldsToAdd = new Map<CollectionConfig, string[]>()

  config.collections.forEach((collection) => {
    if (collection.orderable) {
      const currentFields = fieldsToAdd.get(collection) || []
      fieldsToAdd.set(collection, [...currentFields, '_order'])
      collection.defaultSort = collection.defaultSort ?? '_order'
    }

    traverseFields({
      callback: ({ field, parentRef, ref }) => {
        if (field.type === 'array' || field.type === 'blocks') {
          return false
        }
        if (field.type === 'group' || field.type === 'tab') {
          // @ts-expect-error ref is untyped
          const parentPrefix = parentRef?.prefix ? `${parentRef.prefix}_` : ''
          // @ts-expect-error ref is untyped
          ref.prefix = `${parentPrefix}${field.name}`
        }
        if (field.type === 'join' && field.orderable === true) {
          if (Array.isArray(field.collection)) {
            throw new Error('Orderable joins must target a single collection')
          }
          const relationshipCollection = config.collections.find((c) => c.slug === field.collection)
          if (!relationshipCollection) {
            return false
          }
          field.defaultSort = field.defaultSort ?? `_${field.collection}_${field.name}_order`
          const currentFields = fieldsToAdd.get(relationshipCollection) || []
          // @ts-expect-error ref is untyped
          const prefix = parentRef?.prefix ? `${parentRef.prefix}_` : ''
          fieldsToAdd.set(relationshipCollection, [
            ...currentFields,
            `_${field.collection}_${prefix}${field.name}_order`,
          ])
        }
      },
      fields: collection.fields,
    })
  })

  Array.from(fieldsToAdd.entries()).forEach(([collection, orderableFields]) => {
    addOrderableFieldsAndHook(collection, orderableFields)
  })

  if (fieldsToAdd.size > 0) {
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
      // override the schema to make order fields optional for payload.create()
      typescriptSchema: [
        () => ({
          type: 'string',
          required: false,
        }),
      ],
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

  const orderBeforeChangeHook: BeforeChangeHook = async ({ data, originalDoc, req }) => {
    for (const orderableFieldName of orderableFieldNames) {
      if (!data[orderableFieldName] && !originalDoc?.[orderableFieldName]) {
        console.log('do not enter')
        const lastDoc = await req.payload.find({
          collection: collection.slug,
          depth: 0,
          limit: 1,
          pagination: false,
          req,
          select: { [orderableFieldName]: true },
          sort: `-${orderableFieldName}`,
          where: {
            [orderableFieldName]: {
              exists: true,
            },
          },
        })

        const lastOrderValue = lastDoc.docs[0]?.[orderableFieldName] || null
        data[orderableFieldName] = generateKeyBetween(lastOrderValue, null)
      }
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
      typeof target.id === 'undefined' ||
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
        depth: 0,
        select: { [orderableFieldName]: true },
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
      pagination: false,
      select: { [orderableFieldName]: true },
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
    for (const [index, id] of docsToMove.entries()) {
      await req.payload.update({
        id,
        collection: collection.slug,
        data: {
          [orderableFieldName]: orderValues[index],
        },
        depth: 0,
        req,
        select: { id: true },
      })
    }

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

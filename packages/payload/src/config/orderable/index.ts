import { status as httpStatus } from 'http-status'

import type { BeforeChangeHook, CollectionConfig } from '../../collections/config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { Endpoint, PayloadHandler, SanitizedConfig } from '../types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { APIError } from '../../errors/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { traverseFields } from '../../utilities/traverseFields.js'
import { generateKeyBetween, generateNKeysBetween } from './fractional-indexing.js'

type OrderableFieldConfig = {
  joinOnFieldPath?: string
  name: string
}

const getValueAtPath = (data: unknown, path: string): unknown => {
  if (!data || typeof data !== 'object') {
    return undefined
  }

  const segments = path.split('.')
  let currentValue: unknown = data

  for (const segment of segments) {
    if (!currentValue || typeof currentValue !== 'object') {
      return undefined
    }

    currentValue = (currentValue as Record<string, unknown>)[segment]
  }

  return currentValue
}

const buildJoinScopeWhere = ({
  joinOnFieldPath,
  scopeValue,
}: {
  joinOnFieldPath: string
  scopeValue: unknown
}): null | Record<string, unknown> => {
  if (typeof scopeValue === 'undefined') {
    return null
  }

  if (Array.isArray(scopeValue)) {
    return buildJoinScopeWhere({
      joinOnFieldPath,
      scopeValue: scopeValue[0],
    })
  }

  if (
    scopeValue &&
    typeof scopeValue === 'object' &&
    'relationTo' in scopeValue &&
    'value' in scopeValue
  ) {
    const relation = (scopeValue as { relationTo?: unknown }).relationTo
    const value = (scopeValue as { value?: unknown }).value

    if (typeof relation === 'undefined' || typeof value === 'undefined') {
      return null
    }

    return {
      and: [
        {
          [`${joinOnFieldPath}.relationTo`]: {
            equals: relation,
          },
        },
        {
          [`${joinOnFieldPath}.value`]: {
            equals: value,
          },
        },
      ],
    }
  }

  return {
    [joinOnFieldPath]: {
      equals: scopeValue,
    },
  }
}

/**
 * This function creates:
 * - N fields per collection, named `_order` or `_<collection>_<joinField>_order`
 * - 1 hook per collection
 * - 1 endpoint per app
 *
 * Also, if collection.defaultSort or joinField.defaultSort is not set, it will be set to the orderable field.
 */
export const setupOrderable = (config: SanitizedConfig) => {
  const fieldsToAdd = new Map<CollectionConfig, OrderableFieldConfig[]>()
  const joinFieldPathsByCollection = new Map<string, Map<string, string>>()

  const addOrderableField = ({
    name,
    collection,
    joinOnFieldPath,
  }: {
    collection: CollectionConfig
    joinOnFieldPath?: string
    name: string
  }) => {
    const currentFields = fieldsToAdd.get(collection) || []
    const existingField = currentFields.find((field) => field.name === name)

    if (existingField) {
      if (joinOnFieldPath && !existingField.joinOnFieldPath) {
        existingField.joinOnFieldPath = joinOnFieldPath
      }
      return
    }

    fieldsToAdd.set(collection, [...currentFields, { name, joinOnFieldPath }])

    if (joinOnFieldPath) {
      const currentMap =
        joinFieldPathsByCollection.get(collection.slug) || new Map<string, string>()
      currentMap.set(name, joinOnFieldPath)
      joinFieldPathsByCollection.set(collection.slug, currentMap)
    }
  }

  config.collections.forEach((collection) => {
    if (collection.orderable) {
      addOrderableField({
        name: '_order',
        collection,
      })
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
            throw new APIError(
              'Orderable joins must target a single collection',
              httpStatus.BAD_REQUEST,
              {},
              true,
            )
          }
          const relationshipCollection = config.collections.find((c) => c.slug === field.collection)
          if (!relationshipCollection) {
            return false
          }
          // @ts-expect-error ref is untyped
          const prefix = parentRef?.prefix ? `${parentRef.prefix}_` : ''
          const joinOrderableFieldName = `_${field.collection}_${prefix}${field.name}_order`
          field.defaultSort = field.defaultSort ?? joinOrderableFieldName
          addOrderableField({
            name: joinOrderableFieldName,
            collection: relationshipCollection,
            joinOnFieldPath: field.on,
          })
        }
      },
      fields: collection.fields,
    })
  })

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
    const orderField: Field = {
      name: orderableFieldName,
      type: 'text',
      admin: {
        disableBulkEdit: true,
        disabled: true,
        disableGroupBy: true,
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
        readOnly: true,
      },
      hooks: {
        beforeDuplicate: [
          ({ siblingData }) => {
            delete siblingData[orderableFieldName]
          },
        ],
      },
      index: true,
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
    const body = (await req.json?.()) as OrderableEndpointBody

    const { collectionSlug, docsToMove, newKeyWillBe, orderableFieldName, target } = body

    if (!Array.isArray(docsToMove) || docsToMove.length === 0) {
      return new Response(JSON.stringify({ error: 'docsToMove must be a non-empty array' }), {
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
    if (
      typeof target !== 'object' ||
      typeof target?.id === 'undefined' ||
      (typeof target?.key !== 'string' &&
        target?.key !== null &&
        typeof target?.key !== 'undefined')
    ) {
      return new Response(JSON.stringify({ error: 'target must be an object with id' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      })
    }

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
      const { docs } = await req.payload.find({
        collection: collection.slug,
        depth: 0,
        limit: 0,
        req,
        select: { [orderableFieldName]: true },
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
      await initTransaction(req)
      // We cannot update all documents in a single operation with `payload.update`,
      // because they would all end up with the same order key (`a0`).
      try {
        for (const doc of docs) {
          await req.payload.update({
            id: doc.id,
            collection: collection.slug,
            data: {
              // no data needed since the order hooks will handle this
            },
            depth: 0,
            req,
          })
          await commitTransaction(req)
        }
      } catch (e) {
        await killTransaction(req)
        if (e instanceof Error) {
          throw new APIError(e.message, httpStatus.INTERNAL_SERVER_ERROR)
        }
      }

      return new Response(JSON.stringify({ message: 'initial migration', success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const targetId = target.id
    let targetKey = target.key

    // If targetKey = pending, we need to find its current key.
    // This can only happen if the user reorders rows quickly with a slow connection.
    if (targetKey === 'pending') {
      targetKey = targetDoc?.[orderableFieldName] || null
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

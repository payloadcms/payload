// @ts-strict-ignore

import type { Config, Endpoint, PayloadHandler, SanitizedConfig } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'
import type {
  BeforeChangeHook,
  CollectionConfig,
  SanitizedCollectionConfig,
  SanitizedJoin,
  SanitizedJoins,
} from './types.js'

import { authCollectionEndpoints } from '../../auth/endpoints/index.js'
import executeAccess from '../../auth/executeAccess.js'
import { getBaseAuthFields } from '../../auth/getAuthFields.js'
import { TimestampsRequired } from '../../errors/TimestampsRequired.js'
import { sanitizeFields } from '../../fields/config/sanitize.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import mergeBaseFields from '../../fields/mergeBaseFields.js'
import { uploadCollectionEndpoints } from '../../uploads/endpoints/index.js'
import { getBaseUploadFields } from '../../uploads/getBaseFields.js'
import { flattenAllFields } from '../../utilities/flattenAllFields.js'
import { formatLabels } from '../../utilities/formatLabels.js'
import baseVersionFields from '../../versions/baseFields.js'
import { versionDefaults } from '../../versions/defaults.js'
import { defaultCollectionEndpoints } from '../endpoints/index.js'
import {
  addDefaultsToAuthConfig,
  addDefaultsToCollectionConfig,
  addDefaultsToLoginWithUsernameConfig,
} from './defaults.js'
import { generateKeyBetween, generateNKeysBetween } from './fractional-indexing.js'
import { sanitizeAuthFields, sanitizeUploadFields } from './reservedFieldNames.js'
import { sanitizeCompoundIndexes } from './sanitizeCompoundIndexes.js'
import { validateUseAsTitle } from './useAsTitle.js'

export const sanitizeCollection = async (
  config: Config,
  collection: CollectionConfig,
  /**
   * If this property is set, RichText fields won't be sanitized immediately. Instead, they will be added to this array as promises
   * so that you can sanitize them together, after the config has been sanitized.
   */
  richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>,
  _validRelationships?: string[],
): Promise<SanitizedCollectionConfig> => {
  if (collection._sanitized) {
    return collection as SanitizedCollectionConfig
  }
  collection._sanitized = true
  // /////////////////////////////////
  // Make copy of collection config
  // /////////////////////////////////

  const sanitized: CollectionConfig = addDefaultsToCollectionConfig(collection)

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////

  const validRelationships = _validRelationships ?? config.collections.map((c) => c.slug) ?? []

  const joins: SanitizedJoins = {}
  const polymorphicJoins: SanitizedJoin[] = []
  sanitized.fields = await sanitizeFields({
    collectionConfig: sanitized,
    config,
    fields: sanitized.fields,
    joinPath: '',
    joins,
    parentIsLocalized: false,
    polymorphicJoins,
    richTextSanitizationPromises,
    validRelationships,
  })

  if (sanitized.endpoints !== false) {
    if (!sanitized.endpoints) {
      sanitized.endpoints = []
    }

    if (sanitized.auth) {
      for (const endpoint of authCollectionEndpoints) {
        sanitized.endpoints.push(endpoint)
      }
    }

    if (sanitized.upload) {
      for (const endpoint of uploadCollectionEndpoints) {
        sanitized.endpoints.push(endpoint)
      }
    }

    for (const endpoint of defaultCollectionEndpoints) {
      sanitized.endpoints.push(endpoint)
    }
  }

  if (sanitized.timestamps !== false) {
    // add default timestamps fields only as needed
    let hasUpdatedAt: boolean | null = null
    let hasCreatedAt: boolean | null = null
    sanitized.fields.some((field) => {
      if (fieldAffectsData(field)) {
        if (field.name === 'updatedAt') {
          hasUpdatedAt = true
        }
        if (field.name === 'createdAt') {
          hasCreatedAt = true
        }
      }
      return hasCreatedAt && hasUpdatedAt
    })
    if (!hasUpdatedAt) {
      sanitized.fields.push({
        name: 'updatedAt',
        type: 'date',
        admin: {
          disableBulkEdit: true,
          hidden: true,
        },
        index: true,
        label: ({ t }) => t('general:updatedAt'),
      })
    }
    if (!hasCreatedAt) {
      sanitized.fields.push({
        name: 'createdAt',
        admin: {
          disableBulkEdit: true,
          hidden: true,
        },
        // The default sort for list view is createdAt. Thus, enabling indexing by default, is a major performance improvement, especially for large or a large amount of collections.
        type: 'date',
        index: true,
        label: ({ t }) => t('general:createdAt'),
      })
    }
  }

  sanitized.labels = sanitized.labels || formatLabels(sanitized.slug)

  if (sanitized.versions) {
    if (sanitized.versions === true) {
      sanitized.versions = { drafts: false, maxPerDoc: 100 }
    }

    if (sanitized.timestamps === false) {
      throw new TimestampsRequired(collection)
    }

    sanitized.versions.maxPerDoc =
      typeof sanitized.versions.maxPerDoc === 'number' ? sanitized.versions.maxPerDoc : 100

    if (sanitized.versions.drafts) {
      if (sanitized.versions.drafts === true) {
        sanitized.versions.drafts = {
          autosave: false,
          validate: false,
        }
      }

      if (sanitized.versions.drafts.autosave === true) {
        sanitized.versions.drafts.autosave = {
          interval: versionDefaults.autosaveInterval,
        }
      }

      if (sanitized.versions.drafts.validate === undefined) {
        sanitized.versions.drafts.validate = false
      }

      sanitized.fields = mergeBaseFields(sanitized.fields, baseVersionFields)
    }
  }

  if (sanitized.upload) {
    if (sanitized.upload === true) {
      sanitized.upload = {}
    }

    // sanitize fields for reserved names
    sanitizeUploadFields(sanitized.fields, sanitized)

    sanitized.upload.cacheTags = sanitized.upload?.cacheTags ?? true
    sanitized.upload.bulkUpload = sanitized.upload?.bulkUpload ?? true
    sanitized.upload.staticDir = sanitized.upload.staticDir || sanitized.slug
    sanitized.admin.useAsTitle =
      sanitized.admin?.useAsTitle && sanitized.admin.useAsTitle !== 'id'
        ? sanitized.admin.useAsTitle
        : 'filename'

    const uploadFields = getBaseUploadFields({
      collection: sanitized,
      config,
    })

    sanitized.fields = mergeBaseFields(sanitized.fields, uploadFields)
  }

  if (sanitized.auth) {
    // sanitize fields for reserved names
    sanitizeAuthFields(sanitized.fields, sanitized)

    sanitized.auth = addDefaultsToAuthConfig(
      typeof sanitized.auth === 'boolean' ? {} : sanitized.auth,
    )

    // disable duplicate for auth enabled collections by default
    sanitized.disableDuplicate = sanitized.disableDuplicate ?? true

    if (sanitized.auth.loginWithUsername) {
      if (sanitized.auth.loginWithUsername === true) {
        sanitized.auth.loginWithUsername = addDefaultsToLoginWithUsernameConfig({})
      } else {
        const loginWithUsernameWithDefaults = addDefaultsToLoginWithUsernameConfig(
          sanitized.auth.loginWithUsername,
        )

        // if allowEmailLogin is false, requireUsername must be true
        if (loginWithUsernameWithDefaults.allowEmailLogin === false) {
          loginWithUsernameWithDefaults.requireUsername = true
        }
        sanitized.auth.loginWithUsername = loginWithUsernameWithDefaults
      }
    } else {
      sanitized.auth.loginWithUsername = false
    }

    if (!collection?.admin?.useAsTitle) {
      sanitized.admin.useAsTitle = sanitized.auth.loginWithUsername ? 'username' : 'email'
    }

    sanitized.fields = mergeBaseFields(sanitized.fields, getBaseAuthFields(sanitized.auth))
  }

  if (collection?.admin?.pagination?.limits?.length) {
    sanitized.admin.pagination.limits = collection.admin.pagination.limits
  }

  validateUseAsTitle(sanitized)

  // Enable custom order
  if (collection.isSortable) {
    addSortableFeatures(sanitized)
  }

  const sanitizedConfig = sanitized as SanitizedCollectionConfig

  sanitizedConfig.joins = joins
  sanitizedConfig.polymorphicJoins = polymorphicJoins

  sanitizedConfig.flattenedFields = flattenAllFields({ fields: sanitizedConfig.fields })

  sanitizedConfig.sanitizedIndexes = sanitizeCompoundIndexes({
    fields: sanitizedConfig.flattenedFields,
    indexes: sanitizedConfig.indexes,
  })

  return sanitizedConfig
}

const addSortableFeatures = (sanitized: CollectionConfig) => {
  const ORDER_FIELD_NAME = '_order'

  // 1. Add field
  const orderField: Field = {
    name: ORDER_FIELD_NAME,
    type: 'text',
    admin: {
      disableBulkEdit: true,
      hidden: true,
    },
    index: true,
    label: ({ t }) => t('general:order'),
    required: true,
    unique: true,
  }

  sanitized.fields.unshift(orderField)

  // 2. Add hook
  if (!sanitized.hooks) {
    sanitized.hooks = {}
  }
  if (!sanitized.hooks.beforeChange) {
    sanitized.hooks.beforeChange = []
  }

  const orderBeforeChangeHook: BeforeChangeHook = async ({ data, operation, req }) => {
    // Only set _order on create, not on update (unless explicitly provided)
    if (operation === 'create') {
      // Find the last document to place this one after
      const lastDoc = await req.payload.find({
        collection: sanitized.slug,
        depth: 0,
        limit: 1,
        sort: `-${ORDER_FIELD_NAME}`,
      })

      const lastOrderValue = lastDoc.docs[0]?.[ORDER_FIELD_NAME] || null
      data[ORDER_FIELD_NAME] = generateKeyBetween(lastOrderValue, null)
    }

    return data
  }

  sanitized.hooks.beforeChange.push(orderBeforeChangeHook)

  // 3. Add endpoint
  const reorderHandler: PayloadHandler = async (req) => {
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
      sanitized.access.update,
    )

    const targetId = target.id
    let targetKey = target.key

    // If targetKey = pending, we need to find its current key.
    // This can only happen if the user reorders rows quickly with a slow connection.
    if (targetKey === 'pending') {
      const beforeDoc = await req.payload.findByID({
        id: targetId,
        collection: sanitized.slug,
      })
      targetKey = beforeDoc?.[ORDER_FIELD_NAME] || null
    }

    // The reason the endpoint does not receive this docId as an argument is that there
    // are situations where the user may not see or know what the next or previous one is. For
    // example, access control restrictions, if docBefore is the last one on the page, etc.
    const adjacentDoc = await req.payload.find({
      collection: sanitized.slug,
      depth: 0,
      limit: 1,
      sort: newKeyWillBe === 'greater' ? ORDER_FIELD_NAME : `-${ORDER_FIELD_NAME}`,
      where: {
        [ORDER_FIELD_NAME]: {
          [newKeyWillBe === 'greater' ? 'greater_than' : 'less_than']: targetKey,
        },
      },
    })
    const adjacentDocKey = adjacentDoc.docs?.[0]?.[ORDER_FIELD_NAME] || null

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
        collection: sanitized.slug,
        data: {
          [ORDER_FIELD_NAME]: orderValues[index],
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

  if (!sanitized.endpoints) {
    sanitized.endpoints = []
  }
  sanitized.endpoints.push(reorderEndpoint)
}

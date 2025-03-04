import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

// @ts-strict-ignore
import type { LoginWithUsernameOptions } from '../../auth/types.js'
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
import { getBaseAuthFields } from '../../auth/getAuthFields.js'
import { TimestampsRequired } from '../../errors/TimestampsRequired.js'
import { sanitizeFields } from '../../fields/config/sanitize.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import mergeBaseFields from '../../fields/mergeBaseFields.js'
import { uploadCollectionEndpoints } from '../../uploads/endpoints/index.js'
import { getBaseUploadFields } from '../../uploads/getBaseFields.js'
import { deepMergeWithReactComponents } from '../../utilities/deepMerge.js'
import { flattenAllFields } from '../../utilities/flattenAllFields.js'
import { formatLabels } from '../../utilities/formatLabels.js'
import baseVersionFields from '../../versions/baseFields.js'
import { versionDefaults } from '../../versions/defaults.js'
import { defaultCollectionEndpoints } from '../endpoints/index.js'
import { authDefaults, defaults, loginWithUsernameDefaults } from './defaults.js'
import { sanitizeAuthFields, sanitizeUploadFields } from './reservedFieldNames.js'
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
  // /////////////////////////////////
  // Make copy of collection config
  // /////////////////////////////////

  const sanitized: CollectionConfig = deepMergeWithReactComponents(defaults, collection)

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

    sanitized.auth = deepMergeWithReactComponents(
      authDefaults,
      typeof sanitized.auth === 'object' ? sanitized.auth : {},
    )

    if (!sanitized.auth.disableLocalStrategy && sanitized.auth.verify === true) {
      sanitized.auth.verify = {}
    }

    // disable duplicate for auth enabled collections by default
    sanitized.disableDuplicate = sanitized.disableDuplicate ?? true

    if (!sanitized.auth.strategies) {
      sanitized.auth.strategies = []
    }

    if (sanitized.auth.loginWithUsername) {
      if (sanitized.auth.loginWithUsername === true) {
        sanitized.auth.loginWithUsername = loginWithUsernameDefaults
      } else {
        const loginWithUsernameWithDefaults = {
          ...loginWithUsernameDefaults,
          ...sanitized.auth.loginWithUsername,
        } as LoginWithUsernameOptions

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

  // duplicated in the UI package too. Don't change one without changing the other.
  const ORDER_FIELD_NAME = '_order'

  // Enable custom order
  if (collection.isSortable) {
    // 1. Add field
    const orderField: Field = {
      name: ORDER_FIELD_NAME,
      type: 'text',
      admin: {
        disableBulkEdit: true,
        hidden: true,
      },
      index: true,
      label: 'Order',
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
    const moveBetweenHandler: PayloadHandler = async (req) => {
      const body = await req.json()
      const { betweenIds, docIds } = body as {
        betweenIds: [string | undefined, string | undefined] // tuple [beforeId, afterId]
        docIds: string[] // array of docIds to be moved between the two reference points
      }

      if (!Array.isArray(docIds) || docIds.length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid or empty docIds array' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      if (!Array.isArray(betweenIds) || betweenIds.length !== 2) {
        return new Response(
          JSON.stringify({ error: 'betweenIds must be a tuple of two elements' }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      const [beforeId, afterId] = betweenIds

      // Fetch the order values of the documents we're inserting between
      let beforeOrderValue = null
      let afterOrderValue = null

      // TODO: maybe the endpoint can receive directly the order values?
      if (beforeId) {
        const beforeDoc = await req.payload.findByID({
          id: beforeId,
          collection: sanitized.slug,
        })
        beforeOrderValue = beforeDoc?.[ORDER_FIELD_NAME] || null
      }

      if (afterId) {
        const afterDoc = await req.payload.findByID({
          id: afterId,
          collection: sanitized.slug,
        })
        afterOrderValue = afterDoc?.[ORDER_FIELD_NAME] || null
      }

      const orderValues = generateNKeysBetween(beforeOrderValue, afterOrderValue, docIds.length)

      // Update each document with its new order value
      const updatePromises = docIds.map((id, index) => {
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

    const moveBetweenEndpoint: Endpoint = {
      handler: moveBetweenHandler,
      method: 'post',
      path: '/reorder',
    }

    if (!sanitized.endpoints) {
      sanitized.endpoints = []
    }
    sanitized.endpoints.push(moveBetweenEndpoint)
  }

  const sanitizedConfig = sanitized as SanitizedCollectionConfig

  sanitizedConfig.joins = joins
  sanitizedConfig.polymorphicJoins = polymorphicJoins

  sanitizedConfig.flattenedFields = flattenAllFields({ fields: sanitizedConfig.fields })

  return sanitizedConfig
}

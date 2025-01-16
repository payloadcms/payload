import type { LoginWithUsernameOptions } from '../../auth/types.js'
import type { Config, SanitizedConfig } from '../../config/types.js'
import type { CollectionConfig, SanitizedCollectionConfig, SanitizedJoins } from './types.js'

import { getBaseAuthFields } from '../../auth/getAuthFields.js'
import { TimestampsRequired } from '../../errors/TimestampsRequired.js'
import { sanitizeFields } from '../../fields/config/sanitize.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import mergeBaseFields from '../../fields/mergeBaseFields.js'
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
): Promise<SanitizedCollectionConfig> => {
  // /////////////////////////////////
  // Make copy of collection config
  // /////////////////////////////////

  const sanitized: CollectionConfig = deepMergeWithReactComponents(defaults, collection)

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////

  const validRelationships = (config.collections || []).reduce(
    (acc, c) => {
      acc.push(c.slug)
      return acc
    },
    [collection.slug],
  )
  const joins: SanitizedJoins = {}
  sanitized.fields = await sanitizeFields({
    collectionConfig: sanitized,
    config,
    fields: sanitized.fields,
    joinPath: '',
    joins,
    parentIsLocalized: false,
    richTextSanitizationPromises,
    validRelationships,
  })

  if (sanitized.endpoints !== false) {
    if (!sanitized.endpoints) {
      sanitized.endpoints = []
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

  const sanitizedConfig = sanitized as SanitizedCollectionConfig

  sanitizedConfig.joins = joins

  sanitizedConfig.flattenedFields = flattenAllFields({ fields: sanitizedConfig.fields })

  return sanitizedConfig
}

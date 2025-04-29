// @ts-strict-ignore

import type { Config, SanitizedConfig } from '../../config/types.js'
import type {
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

import merge from 'deepmerge'
import { isPlainObject } from 'is-plain-object'

import type { Config } from '../../config/types'
import type { CollectionConfig, SanitizedCollectionConfig } from './types'

import baseAccountLockFields from '../../auth/baseFields/accountLock'
import baseAPIKeyFields from '../../auth/baseFields/apiKey'
import baseAuthFields from '../../auth/baseFields/auth'
import baseVerificationFields from '../../auth/baseFields/verification'
import TimestampsRequired from '../../errors/TimestampsRequired'
import { sanitizeFields } from '../../fields/config/sanitize'
import { fieldAffectsData } from '../../fields/config/types'
import mergeBaseFields from '../../fields/mergeBaseFields'
import { extractTranslations } from '../../translations/extractTranslations'
import getBaseUploadFields from '../../uploads/getBaseFields'
import { formatLabels } from '../../utilities/formatLabels'
import baseVersionFields from '../../versions/baseFields'
import { authDefaults, defaults } from './defaults'

const translations = extractTranslations(['general:createdAt', 'general:updatedAt'])

const sanitizeCollection = (
  config: Config,
  collection: CollectionConfig,
): SanitizedCollectionConfig => {
  // /////////////////////////////////
  // Make copy of collection config
  // /////////////////////////////////

  const sanitized: CollectionConfig = merge(defaults, collection, {
    isMergeableObject: isPlainObject,
  })

  if (sanitized.timestamps !== false) {
    // add default timestamps fields only as needed
    let hasUpdatedAt = null
    let hasCreatedAt = null
    sanitized.fields.some((field) => {
      if (fieldAffectsData(field)) {
        if (field.name === 'updatedAt') hasUpdatedAt = true
        if (field.name === 'createdAt') hasCreatedAt = true
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
        label: translations['general:updatedAt'],
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
        label: translations['general:createdAt'],
      })
    }
  }

  sanitized.labels = sanitized.labels || formatLabels(sanitized.slug)

  if (sanitized.versions) {
    if (sanitized.versions === true) sanitized.versions = { drafts: false }

    if (sanitized.timestamps === false) {
      throw new TimestampsRequired(collection)
    }

    if (sanitized.versions.drafts) {
      if (sanitized.versions.drafts === true) {
        sanitized.versions.drafts = {
          autosave: false,
          validate: false,
        }
      }

      if (sanitized.versions.drafts.autosave === true) {
        sanitized.versions.drafts.autosave = {
          interval: 2000,
        }
      }

      if (sanitized.versions.drafts.validate === undefined) {
        sanitized.versions.drafts.validate = false
      }

      sanitized.fields = mergeBaseFields(sanitized.fields, baseVersionFields)
    }
  }

  if (sanitized.upload) {
    if (sanitized.upload === true) sanitized.upload = {}

    sanitized.upload.staticDir = sanitized.upload.staticDir || sanitized.slug
    sanitized.upload.staticURL = sanitized.upload.staticURL || `/${sanitized.slug}`
    sanitized.admin.useAsTitle =
      sanitized.admin.useAsTitle && sanitized.admin.useAsTitle !== 'id'
        ? sanitized.admin.useAsTitle
        : 'filename'

    const uploadFields = getBaseUploadFields({
      collection: sanitized,
      config,
    })

    sanitized.fields = mergeBaseFields(sanitized.fields, uploadFields)
  }

  if (sanitized.auth) {
    sanitized.auth = merge(authDefaults, typeof sanitized.auth === 'object' ? sanitized.auth : {}, {
      isMergeableObject: isPlainObject,
    })

    let authFields = []

    if (sanitized.auth.useAPIKey) {
      authFields = authFields.concat(baseAPIKeyFields)
    }

    if (!sanitized.auth.disableLocalStrategy) {
      authFields = authFields.concat(baseAuthFields)

      if (sanitized.auth.verify) {
        if (sanitized.auth.verify === true) sanitized.auth.verify = {}
        authFields = authFields.concat(baseVerificationFields)
      }

      if (sanitized.auth.maxLoginAttempts > 0) {
        authFields = authFields.concat(baseAccountLockFields)
      }
    }

    sanitized.fields = mergeBaseFields(sanitized.fields, authFields)
  }

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////

  const validRelationships = config.collections.map((c) => c.slug) || []
  sanitized.fields = sanitizeFields({
    config,
    fields: sanitized.fields,
    validRelationships,
  })

  return sanitized as SanitizedCollectionConfig
}

export default sanitizeCollection

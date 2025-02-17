// @ts-strict-ignore
import type { Field } from '../../fields/config/types.js'
import type { CollectionConfig } from '../../index.js'

import { ReservedFieldName } from '../../errors/ReservedFieldName.js'
import { fieldAffectsData } from '../../fields/config/types.js'

// Note for future reference: We've slimmed down the reserved field names but left them in here for reference in case it's needed in the future.

/**
 * Reserved field names for collections with auth config enabled
 */
const reservedBaseAuthFieldNames = [
  /* 'email',
  'resetPasswordToken',
  'resetPasswordExpiration', */
  'salt',
  'hash',
]
/**
 * Reserved field names for auth collections with verify: true
 */
const reservedVerifyFieldNames = [
  /* '_verified', '_verificationToken' */
]
/**
 * Reserved field names for auth collections with useApiKey: true
 */
const reservedAPIKeyFieldNames = [
  /* 'enableAPIKey', 'apiKeyIndex', 'apiKey' */
]

/**
 * Reserved field names for collections with upload config enabled
 */
const reservedBaseUploadFieldNames = [
  'file',
  /* 'mimeType',
  'thumbnailURL',
  'width',
  'height',
  'filesize',
  'filename',
  'url',
  'focalX',
  'focalY',
  'sizes', */
]

/**
 * Reserved field names for collections with versions enabled
 */
const reservedVersionsFieldNames = [
  /* '__v', '_status' */
]

/**
 * Sanitize fields for collections with auth config enabled.
 *
 * Should run on top level fields only.
 */
export const sanitizeAuthFields = (fields: Field[], config: CollectionConfig) => {
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]

    if (fieldAffectsData(field) && field.name) {
      if (config.auth && typeof config.auth === 'object' && !config.auth.disableLocalStrategy) {
        const auth = config.auth

        if (reservedBaseAuthFieldNames.includes(field.name)) {
          throw new ReservedFieldName(field, field.name)
        }

        if (auth.verify) {
          if (reservedAPIKeyFieldNames.includes(field.name)) {
            throw new ReservedFieldName(field, field.name)
          }
        }

        /* if (auth.maxLoginAttempts) {
          if (field.name === 'loginAttempts' || field.name === 'lockUntil') {
            throw new ReservedFieldName(field, field.name)
          }
        } */

        /* if (auth.loginWithUsername) {
          if (field.name === 'username') {
            throw new ReservedFieldName(field, field.name)
          }
        } */

        if (auth.verify) {
          if (reservedVerifyFieldNames.includes(field.name)) {
            throw new ReservedFieldName(field, field.name)
          }
        }
      }
    }

    // Handle tabs without a name
    if (field.type === 'tabs') {
      for (let j = 0; j < field.tabs.length; j++) {
        const tab = field.tabs[j]

        if (!('name' in tab)) {
          sanitizeAuthFields(tab.fields, config)
        }
      }
    }

    // Handle presentational fields like rows and collapsibles
    if (!fieldAffectsData(field) && 'fields' in field && field.fields) {
      sanitizeAuthFields(field.fields, config)
    }
  }
}

/**
 * Sanitize fields for collections with upload config enabled.
 *
 * Should run on top level fields only.
 */
export const sanitizeUploadFields = (fields: Field[], config: CollectionConfig) => {
  if (config.upload && typeof config.upload === 'object') {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]

      if (fieldAffectsData(field) && field.name) {
        if (reservedBaseUploadFieldNames.includes(field.name)) {
          throw new ReservedFieldName(field, field.name)
        }
      }

      // Handle tabs without a name
      if (field.type === 'tabs') {
        for (let j = 0; j < field.tabs.length; j++) {
          const tab = field.tabs[j]

          if (!('name' in tab)) {
            sanitizeUploadFields(tab.fields, config)
          }
        }
      }

      // Handle presentational fields like rows and collapsibles
      if (!fieldAffectsData(field) && 'fields' in field && field.fields) {
        sanitizeUploadFields(field.fields, config)
      }
    }
  }
}

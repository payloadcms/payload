// @ts-strict-ignore
import type { Config, SanitizedConfig } from '../../config/types.js'
import type { GlobalConfig, SanitizedGlobalConfig } from './types.js'

import defaultAccess from '../../auth/defaultAccess.js'
import { sanitizeFields } from '../../fields/config/sanitize.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import mergeBaseFields from '../../fields/mergeBaseFields.js'
import { flattenAllFields } from '../../utilities/flattenAllFields.js'
import { toWords } from '../../utilities/formatLabels.js'
import baseVersionFields from '../../versions/baseFields.js'
import { versionDefaults } from '../../versions/defaults.js'
import { defaultGlobalEndpoints } from '../endpoints/index.js'

export const sanitizeGlobal = async (
  config: Config,
  global: GlobalConfig,
  /**
   * If this property is set, RichText fields won't be sanitized immediately. Instead, they will be added to this array as promises
   * so that you can sanitize them together, after the config has been sanitized.
   */
  richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>,
  _validRelationships?: string[],
): Promise<SanitizedGlobalConfig> => {
  if (global._sanitized) {
    return global as SanitizedGlobalConfig
  }
  global._sanitized = true

  global.label = global.label || toWords(global.slug)

  // /////////////////////////////////
  // Ensure that collection has required object structure
  // /////////////////////////////////

  global.endpoints = global.endpoints ?? []
  if (!global.hooks) {
    global.hooks = {}
  }
  if (!global.access) {
    global.access = {}
  }
  if (!global.admin) {
    global.admin = {}
  }

  if (!global.access.read) {
    global.access.read = defaultAccess
  }
  if (!global.access.update) {
    global.access.update = defaultAccess
  }

  if (!global.hooks.beforeValidate) {
    global.hooks.beforeValidate = []
  }
  if (!global.hooks.beforeChange) {
    global.hooks.beforeChange = []
  }
  if (!global.hooks.afterChange) {
    global.hooks.afterChange = []
  }
  if (!global.hooks.beforeRead) {
    global.hooks.beforeRead = []
  }
  if (!global.hooks.afterRead) {
    global.hooks.afterRead = []
  }

  // Sanitize fields
  const validRelationships = _validRelationships ?? config.collections.map((c) => c.slug) ?? []

  global.fields = await sanitizeFields({
    config,
    fields: global.fields,
    parentIsLocalized: false,
    richTextSanitizationPromises,
    validRelationships,
  })

  if (global.endpoints !== false) {
    if (!global.endpoints) {
      global.endpoints = []
    }

    for (const endpoint of defaultGlobalEndpoints) {
      global.endpoints.push(endpoint)
    }
  }

  if (global.versions) {
    if (global.versions === true) {
      global.versions = { drafts: false, max: 100 }
    }

    global.versions.max = typeof global.versions.max === 'number' ? global.versions.max : 100

    if (global.versions.drafts) {
      if (global.versions.drafts === true) {
        global.versions.drafts = {
          autosave: false,
          validate: false,
        }
      }

      if (global.versions.drafts.autosave === true) {
        global.versions.drafts.autosave = {
          interval: versionDefaults.autosaveInterval,
        }
      }

      if (global.versions.drafts.validate === undefined) {
        global.versions.drafts.validate = false
      }

      global.fields = mergeBaseFields(global.fields, baseVersionFields)
    }
  }

  if (!global.custom) {
    global.custom = {}
  }

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////
  let hasUpdatedAt = null
  let hasCreatedAt = null
  global.fields.some((field) => {
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
    global.fields.push({
      name: 'updatedAt',
      type: 'date',
      admin: {
        disableBulkEdit: true,
        hidden: true,
      },
      label: ({ t }) => t('general:updatedAt'),
    })
  }
  if (!hasCreatedAt) {
    global.fields.push({
      name: 'createdAt',
      type: 'date',
      admin: {
        disableBulkEdit: true,
        hidden: true,
      },
      label: ({ t }) => t('general:createdAt'),
    })
  }

  ;(global as SanitizedGlobalConfig).flattenedFields = flattenAllFields({ fields: global.fields })

  return global as SanitizedGlobalConfig
}

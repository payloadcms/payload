import type { Config, SanitizedConfig } from '../../config/types.js'
import type { SanitizedGlobalConfig } from './types.js'

import defaultAccess from '../../auth/defaultAccess.js'
import { sanitizeFields } from '../../fields/config/sanitize.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import mergeBaseFields from '../../fields/mergeBaseFields.js'
import { toWords } from '../../utilities/formatLabels.js'
import baseVersionFields from '../../versions/baseFields.js'
import { versionDefaults } from '../../versions/defaults.js'

export const sanitizeGlobals = async (
  config: Config,
  /**
   * If this property is set, RichText fields won't be sanitized immediately. Instead, they will be added to this array as promises
   * so that you can sanitize them together, after the config has been sanitized.
   */
  richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>,
): Promise<SanitizedGlobalConfig[]> => {
  const { collections, globals } = config

  for (let i = 0; i < globals.length; i++) {
    const global = globals[i]
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
    const validRelationships = collections.map((c) => c.slug) || []
    global.fields = await sanitizeFields({
      config,
      fields: global.fields,
      parentIsLocalized: false,
      richTextSanitizationPromises,
      validRelationships,
    })

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

    globals[i] = global
  }

  return globals as SanitizedGlobalConfig[]
}

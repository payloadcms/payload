import type { Config, SanitizedConfig } from '../../config/types.js'
import type { GlobalConfig, SanitizedGlobalConfig } from './types.js'

import defaultAccess from '../../auth/defaultAccess.js'
import { sanitizeFields } from '../../fields/config/sanitize.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { mergeBaseFields } from '../../fields/mergeBaseFields.js'
import { flattenAllFields } from '../../utilities/flattenAllFields.js'
import { toWords } from '../../utilities/formatLabels.js'
import { baseVersionFields } from '../../versions/baseFields.js'
import { versionDefaults } from '../../versions/defaults.js'
import { defaultGlobalEndpoints } from '../endpoints/index.js'

export const sanitizeGlobal = async ({
  config,
  globalConfig,
  richTextSanitizationPromises,
  validRelationships: _validRelationships,
}: {
  config: Config
  globalConfig: GlobalConfig
  /**
   * If this property is set, RichText fields won't be sanitized immediately. Instead, they will be added to this array as promises
   * so that you can sanitize them together, after the config has been sanitized.
   */
  richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>
  validRelationships?: string[]
}): Promise<SanitizedGlobalConfig> => {
  if (globalConfig._sanitized) {
    return globalConfig as SanitizedGlobalConfig
  }

  globalConfig._sanitized = true

  globalConfig.label = globalConfig.label || toWords(globalConfig.slug)

  // /////////////////////////////////
  // Ensure that collection has required object structure
  // /////////////////////////////////

  globalConfig.endpoints = globalConfig.endpoints ?? []

  if (!globalConfig.hooks) {
    globalConfig.hooks = {}
  }

  if (!globalConfig.access) {
    globalConfig.access = {}
  }

  if (!globalConfig.admin) {
    globalConfig.admin = {}
  }

  if (!globalConfig.access.read) {
    globalConfig.access.read = defaultAccess
  }

  if (!globalConfig.access.update) {
    globalConfig.access.update = defaultAccess
  }

  if (!globalConfig.hooks.beforeValidate) {
    globalConfig.hooks.beforeValidate = []
  }

  if (!globalConfig.hooks.beforeChange) {
    globalConfig.hooks.beforeChange = []
  }

  if (!globalConfig.hooks.afterChange) {
    globalConfig.hooks.afterChange = []
  }

  if (!globalConfig.hooks.beforeRead) {
    globalConfig.hooks.beforeRead = []
  }

  if (!globalConfig.hooks.afterRead) {
    globalConfig.hooks.afterRead = []
  }

  // Sanitize fields
  const validRelationships = _validRelationships ?? config.collections?.map((c) => c.slug) ?? []

  globalConfig.fields = await sanitizeFields({
    config,
    fields: globalConfig.fields,
    parentIsLocalized: false,
    richTextSanitizationPromises,
    validRelationships,
  })

  if (globalConfig.endpoints !== false) {
    if (!globalConfig.endpoints) {
      globalConfig.endpoints = []
    }

    for (const endpoint of defaultGlobalEndpoints) {
      globalConfig.endpoints.push(endpoint)
    }
  }

  if (globalConfig.versions) {
    if (globalConfig.versions === true) {
      globalConfig.versions = { drafts: false, max: 100 }
    }

    globalConfig.versions.max =
      typeof globalConfig.versions.max === 'number' ? globalConfig.versions.max : 100

    if (globalConfig.versions.drafts) {
      if (globalConfig.versions.drafts === true) {
        globalConfig.versions.drafts = {
          autosave: false,
          validate: false,
        }
      }

      if (globalConfig.versions.drafts.autosave === true) {
        globalConfig.versions.drafts.autosave = {
          interval: versionDefaults.autosaveInterval,
        }
      }

      if (globalConfig.versions.drafts.validate === undefined) {
        globalConfig.versions.drafts.validate = false
      }

      globalConfig.fields = mergeBaseFields(globalConfig.fields, baseVersionFields)
    }
  }

  if (!globalConfig.custom) {
    globalConfig.custom = {}
  }

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////
  let hasUpdatedAt: boolean | null = null
  let hasCreatedAt: boolean | null = null

  globalConfig.fields.some((field) => {
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
    globalConfig.fields.push({
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
    globalConfig.fields.push({
      name: 'createdAt',
      type: 'date',
      admin: {
        disableBulkEdit: true,
        hidden: true,
      },
      label: ({ t }) => t('general:createdAt'),
    })
  }

  ;(globalConfig as SanitizedGlobalConfig).flattenedFields = flattenAllFields({
    fields: globalConfig.fields,
  })

  return globalConfig as SanitizedGlobalConfig
}

import type { Config } from '../../config/types.js'
import type { RichTextSanitizer } from '../../fields/config/sanitize.js'
import type { SanitizedDrafts } from '../../versions/types.js'
import type { GlobalConfig, SanitizedGlobalConfig } from './types.js'

import { defaultAccess } from '../../auth/defaultAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { withBaseAccess } from '../../auth/withBaseAccess.js'
import { sanitizeFields } from '../../fields/config/sanitize.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { mergeBaseFields } from '../../fields/mergeBaseFields.js'
import { flattenAllFields } from '../../utilities/flattenAllFields.js'
import { toWords } from '../../utilities/formatLabels.js'
import { traverseForLocalizedFields } from '../../utilities/traverseForLocalizedFields.js'
import { baseVersionFields } from '../../versions/baseFields.js'
import { versionDefaults } from '../../versions/defaults.js'
import { appendGlobalVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { defaultGlobalEndpoints } from '../endpoints/index.js'
export const sanitizeGlobal = (
  config: Config,
  global: GlobalConfig,
  richTextSanitizers?: RichTextSanitizer[],
  _validRelationships?: string[],
): SanitizedGlobalConfig => {
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

  const read = global.access.read ?? defaultAccess
  const configuredReadVersions = global.access.readVersions

  global.access.read = read

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

  if (!global.hooks.beforeOperation) {
    global.hooks.beforeOperation = []
  }

  // Sanitize fields
  const validRelationships = _validRelationships ?? config.collections?.map((c) => c.slug) ?? []

  global.fields = sanitizeFields({
    config,
    fields: global.fields,
    globalConfig: global,
    parentIsLocalized: false,
    richTextSanitizers,
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

  global.versions = global.versions ?? true

  if (global.versions) {
    if (global.versions === true) {
      global.versions = {
        drafts: false,
        max: 100,
      }
    }

    global.versions.max = typeof global.versions.max === 'number' ? global.versions.max : 100

    if (global.versions.drafts) {
      if (global.versions.drafts === true) {
        global.versions.drafts = {
          autosave: false,
          validate: false,
        }
      }

      const hasLocalizedFields = traverseForLocalizedFields(global.fields)

      // Auto-enable per-locale status when localization is configured and the global has localized fields.
      ;(global.versions.drafts as SanitizedDrafts).localizeStatus = !!(
        config.localization && hasLocalizedFields
      )

      if (global.versions.drafts.autosave === true) {
        global.versions.drafts.autosave = {
          interval: versionDefaults.autosaveInterval,
        }
      }

      if (global.versions.drafts.validate === undefined) {
        global.versions.drafts.validate = false
      }

      global.fields = mergeBaseFields(
        global.fields,
        baseVersionFields({
          localized: (global.versions.drafts as SanitizedDrafts).localizeStatus ?? false,
        }),
      )
    }
  }

  if (!global.custom) {
    global.custom = {}
  }

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////
  let hasUpdatedAt: boolean | null = null
  let hasCreatedAt: boolean | null = null
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
        disabled: { bulkEdit: true },
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
        disabled: { bulkEdit: true },
        hidden: true,
      },
      label: ({ t }) => t('general:createdAt'),
    })
  }

  for (const operation of ['read', 'update'] as const) {
    global.access[operation] = withBaseAccess({
      slug: global.slug,
      access: global.access[operation],
      entityType: 'global',
      operation,
    })
  }

  const effectiveRead = global.access.read
  const readVersions =
    configuredReadVersions ??
    (async (args) => {
      const result = await effectiveRead({ ...args, id: undefined })

      return hasWhereAccessResult(result) ? appendGlobalVersionToQueryKey(result) : result
    })

  if (global.versions) {
    global.access.readVersions = withBaseAccess({
      slug: global.slug,
      access: readVersions,
      entityType: 'global',
      operation: 'readVersions',
    })
  } else {
    global.access.readVersions = readVersions
  }

  ;(global as SanitizedGlobalConfig).flattenedFields = flattenAllFields({ fields: global.fields })

  return global as SanitizedGlobalConfig
}

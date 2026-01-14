import type { CollectionConfig } from '../collections/config/types.js'
import type { GlobalConfig } from '../globals/config/types.js'
import type { Autosave, SanitizedDrafts } from '../versions/types.js'

import { versionDefaults } from '../versions/defaults.js'

type EntityConfig = Pick<CollectionConfig | GlobalConfig, 'versions'>

/**
 * Check if an entity has drafts enabled
 */
export const hasDraftsEnabled = (config: EntityConfig): boolean => {
  return Boolean(config?.versions && typeof config.versions === 'object' && config.versions.drafts)
}

/**
 * Check if an entity has autosave enabled
 */
export const hasAutosaveEnabled = (
  config: EntityConfig,
): config is {
  versions: {
    drafts: { autosave: Autosave | false }
  }
} & EntityConfig => {
  return Boolean(
    config?.versions &&
      typeof config.versions === 'object' &&
      config.versions.drafts &&
      typeof config.versions.drafts === 'object' &&
      config.versions.drafts.autosave,
  )
}

/**
 * Check if an entity has validate drafts enabled
 */
export const hasDraftValidationEnabled = (config: EntityConfig): boolean => {
  return Boolean(
    config?.versions &&
      typeof config.versions === 'object' &&
      config.versions.drafts &&
      typeof config.versions.drafts === 'object' &&
      config.versions.drafts.validate,
  )
}

export const hasScheduledPublishEnabled = (
  config: EntityConfig,
): config is {
  versions: {
    drafts: { schedulePublish: SanitizedDrafts['schedulePublish'] }
  }
} & EntityConfig => {
  return Boolean(
    config?.versions &&
      typeof config.versions === 'object' &&
      config.versions.drafts &&
      typeof config.versions.drafts === 'object' &&
      config.versions.drafts.schedulePublish,
  )
}

/**
 * Get the maximum number of versions to keep for an entity
 * Returns maxPerDoc for collections or max for globals
 */
export const getVersionsMax = (config: EntityConfig): number => {
  if (!config?.versions || typeof config.versions !== 'object') {
    return 0
  }
  // Collections have maxPerDoc, globals have max
  if ('maxPerDoc' in config.versions) {
    return config.versions.maxPerDoc ?? 0
  }
  if ('max' in config.versions) {
    return config.versions.max ?? 0
  }
  return 0
}

export const getAutosaveInterval = (config: EntityConfig): number => {
  let interval = versionDefaults.autosaveInterval
  if (
    config?.versions &&
    typeof config.versions === 'object' &&
    config.versions.drafts &&
    typeof config.versions.drafts === 'object' &&
    config.versions.drafts.autosave &&
    typeof config.versions.drafts.autosave === 'object'
  ) {
    interval = config.versions.drafts.autosave.interval ?? versionDefaults.autosaveInterval
  }
  return interval
}

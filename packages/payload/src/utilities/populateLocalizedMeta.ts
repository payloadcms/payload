import type { LocalizedMeta } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'

/**
 * Returned object can be directly assigned to `data.localizedMeta` when saving a document
 */
export function populateLocalizedMeta(args: {
  config: SanitizedConfig
  data: Record<string, unknown>
  publishSpecificLocale?: string
}): LocalizedMeta {
  const { config, data, publishSpecificLocale } = args

  if (!config.localization) {
    return {}
  }

  let localizedMeta: LocalizedMeta = {}
  const now = new Date().toISOString()

  if (!publishSpecificLocale) {
    for (const code of config.localization.localeCodes) {
      const status = data._status === 'published' ? 'published' : 'draft'
      localizedMeta[code] = { status, updatedAt: now }
    }
  } else {
    const incomingLocale = String(publishSpecificLocale)
    const existing = (data.localizedMeta ?? {}) as LocalizedMeta
    localizedMeta = {
      ...existing,
      [incomingLocale]: { status: 'published', updatedAt: now },
    }
  }

  return localizedMeta
}

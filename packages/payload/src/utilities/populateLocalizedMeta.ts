import type { LocalizedMeta } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'

/**
 * Returned object can be directly assigned to `data.localizedMeta` when saving a document
 */
export function populateLocalizedMeta(args: {
  config: SanitizedConfig
  data: Record<string, unknown>
  locale?: string
  publishSpecificLocale?: string
}): LocalizedMeta {
  const { config, data, locale, publishSpecificLocale } = args

  if (!config.localization) {
    return {}
  }

  let localizedMeta: LocalizedMeta = {}
  const now = new Date().toISOString()

  if (data._status === 'published' && !publishSpecificLocale) {
    for (const code of config.localization.localeCodes) {
      localizedMeta[code] = { status: 'published', updatedAt: String(data?.updatedAt) }
    }
  } else if (publishSpecificLocale || (locale && data._status === 'draft')) {
    const status = publishSpecificLocale ? 'published' : 'draft'
    const incomingLocale = String(publishSpecificLocale || locale)
    const existing = data.localizedMeta

    if (!existing) {
      for (const code of config.localization.localeCodes) {
        localizedMeta[code] = {
          status: code === incomingLocale ? status : 'draft',
          updatedAt: now,
        }
      }
    } else {
      localizedMeta = {
        ...existing,
        [incomingLocale]: { status, updatedAt: now },
      }
    }
  }

  return localizedMeta
}

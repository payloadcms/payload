import type { LocalizedMeta } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'

/**
 * Returned object can be directly assigned to `data.localizedMeta` when saving a document
 */
export function populateLocalizedMeta(args: {
  config: SanitizedConfig
  previousMeta: LocalizedMeta
  publishSpecificLocale?: string
  status: 'draft' | 'published'
}): LocalizedMeta {
  const { config, previousMeta, publishSpecificLocale, status } = args

  if (!config.localization) {
    return {}
  }

  const now = new Date().toISOString()
  const localizedMeta: LocalizedMeta = {}

  for (const code of config.localization.localeCodes) {
    if (publishSpecificLocale) {
      // Publishing specific locale: only that locale gets published, others stay as-is or default to draft
      if (code === publishSpecificLocale) {
        localizedMeta[code] = { status: 'published', updatedAt: now }
      } else {
        localizedMeta[code] = previousMeta?.[code] || { status: 'draft', updatedAt: now }
      }
    } else {
      // Publishing all locales: use the status parameter
      localizedMeta[code] = {
        status: status === 'published' ? 'published' : 'draft',
        updatedAt: now,
      }
    }
  }

  return localizedMeta
}

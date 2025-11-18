import type { LocalizedMeta } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'

/**
 * Returned object can be directly assigned to `data.localizedMeta` when saving a document
 */
export function populateLocalizedMeta(args: {
  config: SanitizedConfig
  locale: string
  previousMeta: LocalizedMeta
  publishSpecificLocale?: string
  status: 'draft' | 'published'
}): LocalizedMeta {
  const { config, locale, previousMeta, publishSpecificLocale, status } = args

  if (!config.localization) {
    return {}
  }

  const now = new Date().toISOString()
  const localizedMeta: LocalizedMeta = {}

  const defaultDraft = (): LocalizedMeta[string] => ({ status: 'draft', updatedAt: now })
  const publishedNow = (): LocalizedMeta[string] => ({ status: 'published', updatedAt: now })

  for (const code of config.localization.localeCodes) {
    const previous = previousMeta?.[code]

    if (status === 'draft') {
      if (code === locale) {
        // Incoming locale is saved as draft
        localizedMeta[code] = defaultDraft()
      } else {
        // Other locales keep previous state or become draft if none existed
        localizedMeta[code] = previous || defaultDraft()
      }
      continue
    }

    if (status === 'published') {
      if (publishSpecificLocale) {
        if (code === publishSpecificLocale) {
          // Only publish the specified locale
          localizedMeta[code] = publishedNow()
        } else {
          // Other locales keep previous state or become draft if none existed
          localizedMeta[code] = previous || defaultDraft()
        }
        continue
      }

      // If publishSpecificLocale is false it is publishAll
      localizedMeta[code] = publishedNow()
      continue
    }
  }

  return localizedMeta
}

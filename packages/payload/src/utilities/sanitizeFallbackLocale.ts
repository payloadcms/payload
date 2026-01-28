import type { SanitizedLocalizationConfig } from '../config/types.js'
import type { TypedFallbackLocale } from '../index.js'

interface Args {
  fallbackLocale: TypedFallbackLocale
  locale: string
  localization: SanitizedLocalizationConfig
}

/**
 * Sanitizes fallbackLocale based on a provided fallbackLocale, locale and localization config
 *
 * Handles the following scenarios:
 * - determines if a fallback locale should be used
 * - determines if a locale specific fallback should be used in place of the default locale
 * - sets the fallbackLocale to 'null' if no fallback locale should be used
 */
export const sanitizeFallbackLocale = ({
  fallbackLocale,
  locale,
  localization,
}: Args): TypedFallbackLocale => {
  if (fallbackLocale === undefined || fallbackLocale === null) {
    if (localization && localization.fallback) {
      // Check for locale specific fallback
      const localeSpecificFallback = localization.locales.length
        ? localization.locales.find((localeConfig) => localeConfig.code === locale)?.fallbackLocale
        : undefined

      if (localeSpecificFallback) {
        return localeSpecificFallback
      }

      return localization.defaultLocale
    }

    return false
  } else if (Array.isArray(fallbackLocale)) {
    return fallbackLocale.filter((localeCode) => localization.localeCodes.includes(localeCode))
  } else if (fallbackLocale) {
    if (['false', 'none', 'null'].includes(fallbackLocale)) {
      return false
    }

    if (localization.localeCodes.includes(fallbackLocale)) {
      return fallbackLocale
    }
  }

  return false
}

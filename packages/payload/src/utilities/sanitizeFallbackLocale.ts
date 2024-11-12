import type { SanitizedLocalizationConfig } from '../config/types.js'
import type { TypedLocale } from '../index.js'

interface Args {
  fallbackLocale: false | TypedLocale
  locale: string
  localization: SanitizedLocalizationConfig
}

interface ReturnArgs {
  fallbackLocale: string
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
}: Args): ReturnArgs => {
  const shouldFallback = Boolean(
    (localization && localization.fallback) ||
      (fallbackLocale && !['false', 'none', 'null'].includes(fallbackLocale)),
  )

  if (shouldFallback && fallbackLocale) {
    if (!fallbackLocale) {
      // Check for locale specific fallback
      const localeSpecificFallback =
        localization && localization?.locales?.length
          ? localization.locales.find((localeConfig) => localeConfig.code === locale)
              ?.fallbackLocale
          : undefined

      if (localeSpecificFallback) {
        fallbackLocale = localeSpecificFallback
      } else {
        // Use defaultLocale as fallback otherwise
        if (localization && 'fallback' in localization && localization.fallback) {
          fallbackLocale = localization.defaultLocale
        }
      }
    }
  } else {
    fallbackLocale = 'null'
  }

  return { fallbackLocale }
}

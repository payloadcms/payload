import type { SanitizedLocalizationConfig } from '../config/types.js'

type Args = {
  locale: null | string | undefined
  localization: false | SanitizedLocalizationConfig
  publishAllLocales: boolean
}

export type PublishLocaleSelector = 'all' | (null | string)[]

export function resolvePublishLocales({
  locale,
  localization,
  publishAllLocales,
}: Args): PublishLocaleSelector {
  if (publishAllLocales || locale === 'all') {
    return 'all'
  }

  const locales = [locale ?? (localization ? localization.defaultLocale : null)]

  if (localization) {
    for (const configuredLocale of localization.locales) {
      if (configuredLocale.required) {
        locales.push(configuredLocale.code)
      }
    }
  }

  return [...new Set(locales)]
}

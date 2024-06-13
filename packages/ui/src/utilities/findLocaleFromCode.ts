import type { Locale, SanitizedLocalizationConfig } from 'payload'
/*
 return the Locale for given locale code, else return null
*/
export const findLocaleFromCode = (
  localizationConfig: SanitizedLocalizationConfig,
  locale: string,
): Locale | null => {
  if (!localizationConfig?.locales || localizationConfig.locales.length === 0) {
    return null
  }

  return localizationConfig.locales.find((el) => el?.code === locale)
}

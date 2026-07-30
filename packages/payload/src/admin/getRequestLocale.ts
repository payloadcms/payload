import type { Locale, PayloadRequest, SanitizedLocalizationConfig } from '../index.js'

import { findOne as findPreference } from '../preferences/operations/findOne.js'
import { update as updatePreference } from '../preferences/operations/update.js'

export async function getRequestLocale({
  req,
}: {
  req: PayloadRequest
}): Promise<Locale | undefined> {
  const localization = req.payload.config.localization

  if (!localization) {
    return undefined
  }

  const localeFromParams = req.query.locale as string | undefined

  if (req.user && localeFromParams) {
    await updatePreference({
      key: 'locale',
      req,
      user: req.user,
      value: localeFromParams,
    })
  }

  const preference =
    req.user && !localeFromParams
      ? await findPreference({
          key: 'locale',
          req,
          user: req.user,
        })
      : undefined
  const localeCode = localeFromParams || (preference?.value as string | undefined)

  return (
    findLocaleFromCode({ localeCode, localization }) ??
    findLocaleFromCode({
      localeCode: localization.defaultLocale || 'en',
      localization,
    }) ??
    undefined
  )
}

function findLocaleFromCode({
  localeCode,
  localization,
}: {
  localeCode?: string
  localization: SanitizedLocalizationConfig
}): Locale | null {
  if (!localeCode || !localization.locales.length) {
    return null
  }

  return localization.locales.find(({ code }) => code === localeCode) ?? null
}

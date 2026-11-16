import type { Locale, PayloadRequest, SanitizedLocalizationConfig } from '../index.js'

import { APIError } from '../errors/APIError.js'
import { findOne as findPreference } from '../preferences/operations/findOne.js'
import { update as updatePreference } from '../preferences/operations/update.js'

/** Resolves the request locale from query params, user preferences, or the configured default, persisting an explicit user selection. */
export async function getRequestLocale({
  locale: localeOverride,
  req,
}: {
  /** An explicit operation locale does not update the user preference. */
  locale?: Locale['code']
  req: PayloadRequest
}): Promise<Locale | undefined> {
  const localization = req.payload.config.localization

  if (!localization) {
    return undefined
  }

  if (localeOverride !== undefined) {
    const locale = findLocaleFromCode({ localeCode: localeOverride, localization })

    if (!locale) {
      throw new APIError('Invalid locale', 400)
    }

    return locale
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
  const localeCode = req.user
    ? localeFromParams || (preference?.value as string | undefined)
    : undefined

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

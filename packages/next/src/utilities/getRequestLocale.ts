import type { Locale, PayloadRequest } from 'payload'

import { upsertPreferences } from '@payloadcms/ui/rsc'
import { findLocaleFromCode } from '@payloadcms/ui/shared'
import { APIError } from 'payload'

import { getPreferences } from './getPreferences.js'

type GetRequestLocalesArgs = {
  /** An explicit operation locale does not update the user preference. */
  locale?: Locale['code']
  req: PayloadRequest
}

export async function getRequestLocale({
  locale: localeOverride,
  req,
}: GetRequestLocalesArgs): Promise<Locale> {
  if (req.payload.config.localization) {
    if (localeOverride !== undefined) {
      const locale = findLocaleFromCode(req.payload.config.localization, localeOverride)

      if (!locale) {
        throw new APIError('Invalid locale', 400)
      }

      return locale
    }

    const localeFromParams = req.query.locale as string | undefined

    if (req.user && localeFromParams) {
      await upsertPreferences<Locale['code']>({ key: 'locale', req, value: localeFromParams })
    }

    return (
      (req.user &&
        findLocaleFromCode(
          req.payload.config.localization,
          localeFromParams ||
            (
              await getPreferences<Locale['code']>(
                'locale',
                req.payload,
                req.user.id,
                req.user.collection,
              )
            )?.value,
        )) ||
      findLocaleFromCode(
        req.payload.config.localization,
        req.payload.config.localization.defaultLocale || 'en',
      )
    )
  }

  return undefined
}

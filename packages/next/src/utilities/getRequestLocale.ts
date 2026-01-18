import type { Locale, PayloadRequest } from '@ruya.sa/payload'

import { upsertPreferences } from '@ruya.sa/ui/rsc'
import { findLocaleFromCode } from '@ruya.sa/ui/shared'

import { getPreferences } from './getPreferences.js'

type GetRequestLocalesArgs = {
  req: PayloadRequest
}

export async function getRequestLocale({ req }: GetRequestLocalesArgs): Promise<Locale> {
  if (req.payload.config.localization) {
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

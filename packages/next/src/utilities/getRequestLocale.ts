import type { Locale, PayloadRequest } from 'payload'

import { upsertPreferences } from '@payloadcms/ui/rsc'
import { findLocaleFromCode } from '@payloadcms/ui/shared'

import { getPreferences } from './getPreferences.js'

type GetRequestLocalesArgs = {
  localeFromParams?: string
  req: PayloadRequest
}

export async function getRequestLocale({
  localeFromParams,
  req,
}: GetRequestLocalesArgs): Promise<Locale> {
  if (req.payload.config.localization) {
    if (localeFromParams) {
      await upsertPreferences<Locale['code']>({ key: 'locale', req, value: localeFromParams })
    }

    return (
      findLocaleFromCode(
        req.payload.config.localization,
        localeFromParams || (await getPreferences<Locale['code']>('locale', req.payload, req.user)),
      ) ||
      findLocaleFromCode(
        req.payload.config.localization,
        req.payload.config.localization.defaultLocale || 'en',
      )
    )
  }

  return undefined
}

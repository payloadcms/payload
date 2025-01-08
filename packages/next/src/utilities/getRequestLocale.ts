import type { Locale, Payload, User } from 'payload'

import { findLocaleFromCode } from '@payloadcms/ui/shared'

import { getPreference } from './getPreference.js'

type GetRequestLocalesArgs = {
  localeFromParams?: string
  payload: Payload
  user: User
}

export async function getRequestLocale({
  localeFromParams,
  payload,
  user,
}: GetRequestLocalesArgs): Promise<Locale> {
  if (payload.config.localization) {
    const localeFromPrefs = await getPreference<Locale['code']>('locale', payload, user)

    return (
      findLocaleFromCode(payload.config.localization, localeFromParams || localeFromPrefs) ||
      findLocaleFromCode(
        payload.config.localization,
        payload.config.localization.defaultLocale || 'en',
      )
    )
  }

  return undefined
}

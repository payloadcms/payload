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
    return (
      findLocaleFromCode(
        payload.config.localization,
        localeFromParams || (await getPreference<Locale['code']>('locale', payload, user)),
      ) ||
      findLocaleFromCode(
        payload.config.localization,
        payload.config.localization.defaultLocale || 'en',
      )
    )
  }

  return undefined
}

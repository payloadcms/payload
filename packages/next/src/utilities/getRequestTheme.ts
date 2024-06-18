import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js'
import type { SanitizedConfig } from 'payload'

import { type Theme, defaultTheme } from '@payloadcms/ui/client'

type GetRequestLanguageArgs = {
  config: SanitizedConfig
  cookies: Map<string, string> | ReadonlyRequestCookies
  headers: Request['headers']
}

const acceptedThemes: Theme[] = ['dark', 'light']

export const getRequestTheme = ({ config, cookies, headers }: GetRequestLanguageArgs): Theme => {
  const themeCookie = cookies.get(`${config.cookiePrefix || 'payload'}-theme`)

  const themeFromCookie: Theme = (
    typeof themeCookie === 'string' ? themeCookie : themeCookie?.value
  ) as Theme

  if (themeFromCookie && acceptedThemes.includes(themeFromCookie)) {
    return themeFromCookie
  }

  const themeFromHeader = headers.get('Sec-CH-Prefers-Color-Scheme') as Theme

  if (themeFromHeader && acceptedThemes.includes(themeFromHeader)) {
    return themeFromHeader
  }

  return defaultTheme
}

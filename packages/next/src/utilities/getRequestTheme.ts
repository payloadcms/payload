import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js'
import type { SanitizedConfig } from 'payload'

import { defaultTheme, type Theme } from '@payloadcms/ui'

type GetRequestLanguageArgs = {
  config: SanitizedConfig
  cookies: Map<string, string> | ReadonlyRequestCookies
  headers: Request['headers']
}

const acceptedThemes: Theme[] = ['dark', 'light']

/**
 * Determines the theme for a request based on admin settings, cookies, and headers.
 * Priority:
 * 1. Admin-configured theme (if not 'all')
 * 2. Theme from cookies (user preference)
 * 3. Theme from 'Sec-CH-Prefers-Color-Scheme' header (limited browser support)
 * 4. Default theme
 */
export const getRequestTheme = ({ config, cookies, headers }: GetRequestLanguageArgs): Theme => {
  if (config.admin.theme !== 'all' && acceptedThemes.includes(config.admin.theme)) {
    return config.admin.theme
  }

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

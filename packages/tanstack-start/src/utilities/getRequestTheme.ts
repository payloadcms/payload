import type { SanitizedConfig } from 'payload'

import { defaultTheme, type Theme } from '@payloadcms/ui'

type GetRequestThemeArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
  headers: Headers
}

const acceptedThemes: Theme[] = ['dark', 'light']

export function getRequestTheme({ config, cookies, headers }: GetRequestThemeArgs): Theme {
  if (config.admin.theme !== 'all' && acceptedThemes.includes(config.admin.theme)) {
    return config.admin.theme
  }

  const themeCookie = cookies.get(`${config.cookiePrefix || 'payload'}-theme`)

  if (themeCookie && acceptedThemes.includes(themeCookie as Theme)) {
    return themeCookie as Theme
  }

  const themeFromHeader = headers.get('Sec-CH-Prefers-Color-Scheme') as Theme

  if (themeFromHeader && acceptedThemes.includes(themeFromHeader)) {
    return themeFromHeader
  }

  return defaultTheme
}

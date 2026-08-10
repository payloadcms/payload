import type { SanitizedConfig } from 'payload'

import { defaultTheme, type Theme } from '../providers/Theme/shared.js'

type GetRequestThemeArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
  headers: Request['headers']
}

const acceptedThemes: Theme[] = ['dark', 'light']

export const getRequestTheme = ({ config, cookies, headers }: GetRequestThemeArgs): Theme => {
  if (config.admin.theme !== 'all' && acceptedThemes.includes(config.admin.theme)) {
    return config.admin.theme
  }

  const themeFromCookie = cookies.get(`${config.cookiePrefix || 'payload'}-theme`) as Theme

  if (themeFromCookie && acceptedThemes.includes(themeFromCookie)) {
    return themeFromCookie
  }

  const themeFromHeader = headers.get('Sec-CH-Prefers-Color-Scheme') as Theme

  if (themeFromHeader && acceptedThemes.includes(themeFromHeader)) {
    return themeFromHeader
  }

  return defaultTheme
}

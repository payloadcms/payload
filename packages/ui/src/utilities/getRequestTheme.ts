import type { SanitizedConfig } from 'payload'

import { defaultTheme, type Theme } from '../providers/Theme/shared.js'

type GetRequestThemeArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
  headers: Request['headers']
}

export type RequestThemeSource = 'config' | 'cookie' | 'default' | 'header'

export type RequestThemeResult = {
  /** The request's resolved theme. */
  theme: Theme
  /** The input used to resolve the theme. */
  themeSource: RequestThemeSource
}

const acceptedThemes: Theme[] = ['dark', 'light']

export const getRequestTheme = ({
  config,
  cookies,
  headers,
}: GetRequestThemeArgs): RequestThemeResult => {
  if (config.admin.theme !== 'all' && acceptedThemes.includes(config.admin.theme)) {
    return { theme: config.admin.theme, themeSource: 'config' }
  }

  const themeFromCookie = cookies.get(`${config.cookiePrefix || 'payload'}-theme`) as Theme

  if (themeFromCookie && acceptedThemes.includes(themeFromCookie)) {
    return { theme: themeFromCookie, themeSource: 'cookie' }
  }

  const themeFromHeader = headers.get('Sec-CH-Prefers-Color-Scheme') as Theme

  if (themeFromHeader && acceptedThemes.includes(themeFromHeader)) {
    return { theme: themeFromHeader, themeSource: 'header' }
  }

  return { theme: defaultTheme, themeSource: 'default' }
}

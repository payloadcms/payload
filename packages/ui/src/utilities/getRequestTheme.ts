import type { SanitizedConfig } from 'payload'

import { defaultTheme, type Theme } from '../providers/Theme/shared.js'

type GetRequestThemeArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
  headers: Request['headers']
}

export type RequestThemeSource = 'config' | 'cookie' | 'default' | 'header'

export type RequestThemeResult = {
  /** The input used to resolve the theme. */
  source: RequestThemeSource
  /** The request's resolved theme. */
  theme: Theme
}

const acceptedThemes: Theme[] = ['dark', 'light']

export const getRequestTheme = ({ config, cookies, headers }: GetRequestThemeArgs): Theme => {
  return getRequestThemeWithSource({ config, cookies, headers }).theme
}

export const getRequestThemeWithSource = ({
  config,
  cookies,
  headers,
}: GetRequestThemeArgs): RequestThemeResult => {
  if (config.admin.theme !== 'all' && acceptedThemes.includes(config.admin.theme)) {
    return { source: 'config', theme: config.admin.theme }
  }

  const themeFromCookie = cookies.get(`${config.cookiePrefix || 'payload'}-theme`) as Theme

  if (themeFromCookie && acceptedThemes.includes(themeFromCookie)) {
    return { source: 'cookie', theme: themeFromCookie }
  }

  const themeFromHeader = headers.get('Sec-CH-Prefers-Color-Scheme') as Theme

  if (themeFromHeader && acceptedThemes.includes(themeFromHeader)) {
    return { source: 'header', theme: themeFromHeader }
  }

  return { source: 'default', theme: defaultTheme }
}

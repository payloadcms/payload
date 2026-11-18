import type { SanitizedConfig } from 'payload'

import type { Theme } from '../providers/Theme/shared.js'

import { defaultTheme, themeCookieSuffix } from '../providers/Theme/shared.js'

type GetRequestThemeArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
  headers: Request['headers']
}

/**
 * The request input used to resolve the theme.
 * `'fallback'` means no usable config, cookie, or client hint was available; the browser may still resolve the system preference.
 */
export type RequestThemeSource = 'fallback' | keyof GetRequestThemeArgs

export type RequestThemeResult = {
  /** The request's resolved theme. */
  theme: Theme
  /** The input used to resolve the theme. */
  themeSource: RequestThemeSource
}

const acceptedThemes: Theme[] = ['dark', 'light']

/** @internal */
export const getRequestTheme = ({
  config,
  cookies,
  headers,
}: GetRequestThemeArgs): RequestThemeResult => {
  if (config.admin.theme !== 'all' && acceptedThemes.includes(config.admin.theme)) {
    return { theme: config.admin.theme, themeSource: 'config' }
  }

  const themeFromCookie = cookies.get(`${config.cookiePrefix}${themeCookieSuffix}`) as Theme

  if (themeFromCookie && acceptedThemes.includes(themeFromCookie)) {
    return { theme: themeFromCookie, themeSource: 'cookies' }
  }

  const themeFromHeader = headers.get('Sec-CH-Prefers-Color-Scheme') as Theme

  if (themeFromHeader && acceptedThemes.includes(themeFromHeader)) {
    return { theme: themeFromHeader, themeSource: 'headers' }
  }

  return { theme: defaultTheme, themeSource: 'fallback' }
}

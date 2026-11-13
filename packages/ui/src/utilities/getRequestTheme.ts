import type { SanitizedConfig } from 'payload'

import type { Theme } from '../providers/Theme/shared.js'

import { resolveTheme } from '../providers/Theme/utilities.js'

type GetRequestThemeArgs = {
  /** Sanitized config, including its defaulted cookie prefix. */
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

/**
 * Resolves the admin theme from sanitized config and request preferences.
 * Priority: config (ignoring `all`), cookie, color-scheme client hint, then the default theme.
 */
export const getRequestTheme = ({
  config,
  cookies,
  headers,
}: GetRequestThemeArgs): RequestThemeResult => {
  const { theme, themeSource } = resolveTheme({
    themeFromCookie: cookies.get(`${config.cookiePrefix}-theme`),
    themeFromSystem: headers.get('Sec-CH-Prefers-Color-Scheme'),
    themeSettingFromConfig: config.admin.theme,
  })

  return {
    theme,
    themeSource:
      themeSource === 'preference' ? 'cookie' : themeSource === 'system' ? 'header' : themeSource,
  }
}

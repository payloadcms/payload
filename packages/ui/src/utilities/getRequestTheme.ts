import type { SanitizedConfig } from 'payload'

import type { Theme } from '../providers/Theme/shared.js'

import { resolveTheme } from '../providers/Theme/shared.js'

type GetRequestThemeArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
  headers: Request['headers']
}

/** @internal */
export type RequestThemeSource = 'config' | 'cookie' | 'default' | 'header'

/** @internal */
export type RequestThemeResult = {
  /** The request's resolved theme. */
  theme: Theme
  /** The input used to resolve the theme. */
  themeSource: RequestThemeSource
}

/** @internal */
export const getRequestTheme = ({
  config,
  cookies,
  headers,
}: GetRequestThemeArgs): RequestThemeResult => {
  const { theme, themeSource } = resolveTheme({
    themeFromCookie: cookies.get(`${config.cookiePrefix || 'payload'}-theme`),
    themeFromSystem: headers.get('Sec-CH-Prefers-Color-Scheme'),
    themeSettingFromConfig: config.admin.theme,
  })

  return {
    theme,
    themeSource:
      themeSource === 'preference' ? 'cookie' : themeSource === 'system' ? 'header' : themeSource,
  }
}

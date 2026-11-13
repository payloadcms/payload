import type { SanitizedConfig } from 'payload'

export type Theme = 'dark' | 'light'

export const defaultTheme: Theme = 'light'

/**
 * Priority: config (ignoring `all`), cookie, system preference, then the default theme.
 * @internal
 */
export const resolveTheme = ({
  themeFromCookie,
  themeFromSystem,
  themeSettingFromConfig,
}: {
  /** Raw cookie value; only `light` and `dark` override automatic resolution. */
  themeFromCookie?: unknown
  /** System preference, e.g. media-query detection or a request client hint. */
  themeFromSystem?: unknown
  themeSettingFromConfig?: SanitizedConfig['admin']['theme']
}): {
  autoMode: boolean
  theme: Theme
  themeSource: 'config' | 'default' | 'preference' | 'system'
} => {
  // Ignore `all` in config so user and system preferences can determine the theme.
  if (isValidTheme(themeSettingFromConfig)) {
    return { autoMode: false, theme: themeSettingFromConfig, themeSource: 'config' }
  }

  if (isValidTheme(themeFromCookie)) {
    return { autoMode: false, theme: themeFromCookie, themeSource: 'preference' }
  }

  if (isValidTheme(themeFromSystem)) {
    return { autoMode: true, theme: themeFromSystem, themeSource: 'system' }
  }

  return { autoMode: true, theme: defaultTheme, themeSource: 'default' }
}

const isValidTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark'

import type { SanitizedConfig } from 'payload'

import type { Theme } from '../providers/Theme/shared.js'

import { defaultTheme } from '../providers/Theme/shared.js'

/** @internal */
export { defaultTheme }

/** @internal */
export type { Theme }

/** @internal */
export type ThemePreference = 'auto' | Theme

/** @internal */
export type ThemeSource = 'config' | 'default' | 'preference' | 'system'

/** @internal */
export type ResolvedTheme = {
  /** Whether the system preference determines the theme instead of config or an explicit preference. */
  autoMode: boolean
  theme: Theme
  /** `default` means no usable input was available; browser detection may still be needed. */
  themeSource: ThemeSource
}

/** @internal */
export type ResolveThemeArgs = {
  /** Raw cookie value; only `light` and `dark` override automatic resolution. */
  themeFromCookie?: unknown
  /** System preference, e.g. media-query detection or a request client hint. */
  themeFromSystem?: unknown
  themeSettingFromConfig?: SanitizedConfig['admin']['theme']
}

/**
 * Resolves theme inputs without reading browser state, mutating the DOM, or persisting preferences.
 * Priority: config (ignoring `all`), cookie, system preference, then the default theme.
 * @internal
 */
export const resolveTheme = ({
  themeFromCookie,
  themeFromSystem,
  themeSettingFromConfig,
}: ResolveThemeArgs): ResolvedTheme => {
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

/**
 * Reads the system color-scheme preference, falling back to the default theme when unavailable.
 * @internal
 */
export const getThemeFromSystem = (): Theme => {
  try {
    return typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : defaultTheme
  } catch {
    return defaultTheme
  }
}

/**
 * Reads the raw theme cookie from supplied request cookies or the current document.
 * @internal
 */
export const getThemeFromCookie = ({
  cookieKey,
  cookies,
}: {
  cookieKey: string
  cookies?: ReadonlyMap<string, string>
}): string | undefined => {
  if (cookies !== undefined) {
    return cookies.get(cookieKey)
  }

  if (typeof document === 'undefined') {
    return undefined
  }

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${cookieKey}=`))
    ?.split('=')[1]
}

/**
 * Resolves high contrast mode without reading browser state or persisting preferences.
 * Priority: cookie, system preference, then disabled.
 * @internal
 */
export const resolveHighContrastMode = ({
  highContrastModeFromCookie,
  highContrastModeFromSystem,
}: {
  highContrastModeFromCookie?: unknown
  highContrastModeFromSystem?: boolean
}): boolean => {
  if (highContrastModeFromCookie === 'true') {
    return true
  }

  if (highContrastModeFromCookie === 'false') {
    return false
  }

  return highContrastModeFromSystem ?? false
}

/**
 * Reads the system contrast preference, falling back to disabled when unavailable.
 * @internal
 */
export const getHighContrastModeFromSystem = (): boolean => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-contrast: more)').matches
    )
  } catch {
    return false
  }
}

type GetRequestThemeArgs = {
  config: SanitizedConfig
  /** Cookies received by the admin origin, e.g. `parseCookies(req.headers)` from `payload/shared`. */
  cookies: Map<string, string>
  headers: Request['headers']
}

/** @internal */
export type RequestThemeSource = 'config' | 'cookie' | 'default' | 'header'

/** @internal */
export type RequestThemeResult = {
  /** The request's resolved theme. */
  theme: Theme
  /** Validated cookie value, before resolution; `null` means no valid saved preference. */
  themeFromCookie: null | ThemePreference
  /** A forced admin theme, or `all` to allow user and system preferences. */
  themeSettingFromConfig: SanitizedConfig['admin']['theme']
  /** The input used to resolve the theme. */
  themeSource: RequestThemeSource
}

/**
 * Resolves the request theme and returns the raw cookie/config inputs for client-side bootstrap.
 * @internal
 */
export const getRequestTheme = ({
  config,
  cookies,
  headers,
}: GetRequestThemeArgs): RequestThemeResult => {
  const themeSettingFromConfig = config.admin?.theme
  const themeFromCookie = getThemeFromCookie({
    cookieKey: `${config.cookiePrefix || 'payload'}-theme`,
    cookies,
  })

  const { theme, themeSource } = resolveTheme({
    themeFromCookie,
    themeFromSystem: headers.get('Sec-CH-Prefers-Color-Scheme'),
    themeSettingFromConfig,
  })

  return {
    theme,
    themeFromCookie:
      isValidTheme(themeFromCookie) || themeFromCookie === 'auto' ? themeFromCookie : null,
    themeSettingFromConfig: isValidTheme(themeSettingFromConfig) ? themeSettingFromConfig : 'all',
    themeSource:
      themeSource === 'preference' ? 'cookie' : themeSource === 'system' ? 'header' : themeSource,
  }
}

const isValidTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark'

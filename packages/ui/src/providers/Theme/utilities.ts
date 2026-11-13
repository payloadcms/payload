import type { SanitizedConfig } from 'payload'

import type { Theme } from './shared.js'

import { defaultTheme } from './shared.js'

/**
 * Resolves the theme, its source, and automatic mode without reading browser state or saving preferences.
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

/**
 * Reads the system color-scheme preference through `matchMedia`.
 * Returns the default theme when browser detection is unavailable or fails.
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
 * Reads the raw, unvalidated value of the named cookie from the current document.
 * Returns `undefined` when the cookie or document is unavailable.
 * @internal
 */
export const getThemeFromCookie = ({ cookieKey }: { cookieKey: string }): string | undefined => {
  if (typeof document === 'undefined') {
    return undefined
  }

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${cookieKey}=`))
    ?.split('=')[1]
}

/**
 * Resolves enhanced contrast from cookie and system values without reading browser state.
 * Priority: cookie, system preference, then disabled.
 * @internal
 */
export const resolveHighContrastMode = ({
  highContrastModeFromCookie,
  highContrastModeFromSystem,
}: {
  /** Raw cookie value; only the strings `true` and `false` override the system preference. */
  highContrastModeFromCookie?: unknown
  /** The system contrast preference, if available. */
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
 * Reads the system's `prefers-contrast: more` preference.
 * Returns `false` when browser detection is unavailable or fails.
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

/**
 * Checks whether a query parameter is `auto`, `light`, or `dark`.
 * The caller must lowercase the value before validation.
 * @internal
 */
export const isValidThemeParam = (value: null | string): value is 'auto' | Theme =>
  value === 'auto' || value === 'light' || value === 'dark'

/** Narrows an unknown value to a concrete `light` or `dark` theme. */
const isValidTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark'

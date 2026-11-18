import type { ThemeProviderProps } from './context.js'
import type { Theme } from './shared.js'

import { defaultTheme } from './shared.js'

/**
 * Reads the saved theme, falling back to the system preference.
 * Returns the resolved theme and automatic mode without changing document attributes.
 * @internal
 */
export const detectTheme = ({
  cookieKey,
}: {
  cookieKey: string
}): { isAutoMode: boolean; theme: Theme } => {
  const fromCookie = window.document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${cookieKey}=`))
    ?.split('=')[1]

  const theme: Theme =
    fromCookie === 'light' || fromCookie === 'dark' ? fromCookie : getThemeFromSystem()

  return { isAutoMode: fromCookie !== 'light' && fromCookie !== 'dark', theme }
}

/**
 * Reads the saved contrast choice, falling back to the system preference.
 * Does not change document attributes.
 * @internal
 */
export const detectHighContrastMode = ({ cookieKey }: { cookieKey: string }): boolean => {
  const fromCookie =
    window.document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${cookieKey}=`))
      ?.split('=')[1] ?? null

  return fromCookie === 'true'
    ? true
    : fromCookie === 'false'
      ? false
      : getHighContrastModeFromSystem()
}

/** Reads the system contrast preference, falling back to false when matchMedia is unavailable. @internal */
export const getHighContrastModeFromSystem = (): boolean =>
  !!window.matchMedia?.('(prefers-contrast: more)').matches

/** Reads the system color-scheme preference, falling back to the default theme when matchMedia is unavailable. @internal */
export const getThemeFromSystem = (): Theme =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : defaultTheme

/** Checks a lowercased query value for an explicit theme or automatic mode. @internal */
export const isValidThemeParam = (value: null | string): value is 'auto' | Theme =>
  value === 'auto' || value === 'light' || value === 'dark'

/**
 * Discovers the target element to apply HTML theme attributes to, defined by the `targetRef` of the `ThemeProvider`.
 * @internal
 */
export const getThemeTarget = ({
  method,
  targetRef,
}: {
  method: 'setHighContrastMode' | 'setTheme'
  targetRef: ThemeProviderProps['targetRef']
}): HTMLElement => {
  if (!targetRef) {
    throw new Error(
      `${method} requires targetRef on ThemeProvider. Wrap the target element with ThemeProvider, update its controlled props instead, or use useRootTheme to change root preferences.`,
    )
  }

  const target = targetRef.current

  if (!target?.isConnected) {
    throw new Error(
      `${method} could not find a mounted target element. Render the element with targetRef inside ThemeProvider before calling its setters.`,
    )
  }

  if (target === target.ownerDocument.documentElement) {
    throw new Error(`${method} cannot target the document root. Use useRootTheme instead.`)
  }

  return target
}

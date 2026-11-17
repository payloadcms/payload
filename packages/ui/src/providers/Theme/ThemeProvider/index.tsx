'use client'
import React, { useCallback, useMemo } from 'react'

import type { ThemeProviderProps } from '../context.js'
import type { Theme } from '../shared.js'

import { useControllableState } from '../../../hooks/useControllableState.js'
import { Context, useTheme } from '../context.js'
import { getThemeTarget } from '../utilities.js'

/**
 * `ThemeProvider` can be nested as needed to override the theme for part of the UI.
 * Unlike the `RootThemeProvider`, a `ThemeProvider`:
 *
 * - Never reads or writes site-wide cookies or detects system preferences.
 * - Sets HTML attributes on the provided `targetRef` element, rather than the document's `<html>` element.
 *
 * @example
 * ```tsx
 * <div data-theme="dark" data-enhanced-contrast="true">...</div>
 * ```
 *
 * Within the admin panel, when using a `ThemeProvider`, call `useRootTheme` to escape any nested providers and read or update the `RootThemeProvider`.
 *
 * @example
 * Inside a nested provider, `useTheme` reads that local scope.
 * `useRootTheme` escapes to the root preferences.
 *
 * ```tsx
 * function ThemeValues() {
 *   const { theme } = useTheme()
 *   const { theme: rootTheme } = useRootTheme()
 *
 *   return (
 *     <>
 *       <p>Local theme: {theme}</p>
 *       <p>Root theme: {rootTheme}</p>
 *     </>
 *   )
 * }
 *
 * <RootThemeProvider theme="light">
 *   <ThemeProvider theme="dark">
 *     <div data-theme="dark">
 *       <ThemeValues />
 *     </div>
 *   </ThemeProvider>
 * </RootThemeProvider>
 * ```
 *
 * @see `RootThemeProvider` for managing site-wide theme preferences.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  highContrastMode: highContrastModeOverride,
  targetRef,
  theme: themeOverride,
}) => {
  const parentContext = useTheme()

  const [localTheme, setLocalTheme] = useControllableState(themeOverride)

  const [localHighContrastMode, setLocalHighContrastMode] =
    useControllableState(highContrastModeOverride)

  const themePreference = targetRef ? localTheme : themeOverride
  const contrastPreference = targetRef ? localHighContrastMode : highContrastModeOverride

  const autoMode = themePreference === undefined ? parentContext.autoMode : false

  const theme = themePreference ?? parentContext.theme

  const highContrastMode = contrastPreference ?? parentContext.highContrastMode

  /**
   * Sets the local theme and target's `data-theme` HTML attribute.
   * Requires a mounted `targetRef`.
   */
  const setTheme = useCallback(
    (themeToSet: Theme) => {
      const target = getThemeTarget({ method: 'setTheme', targetRef })

      if (themeToSet !== 'light' && themeToSet !== 'dark') {
        throw new Error(
          'ThemeProvider.setTheme accepts only light or dark. Use useRootTheme().setTheme("auto") for automatic mode.',
        )
      }

      target.setAttribute('data-theme', themeToSet)
      setLocalTheme(themeToSet)
    },
    [setLocalTheme, targetRef],
  )

  /**
   * Sets local contrast and target's `data-enhanced-contrast` HTML attribute.
   * Requires a mounted `targetRef`.
   */
  const setHighContrastMode = useCallback(
    (isHighContrast: boolean) => {
      getThemeTarget({ method: 'setHighContrastMode', targetRef }).toggleAttribute(
        'data-enhanced-contrast',
        isHighContrast,
      )

      setLocalHighContrastMode(isHighContrast)
    },
    [setLocalHighContrastMode, targetRef],
  )

  const value = useMemo(
    () => ({ autoMode, highContrastMode, setHighContrastMode, setTheme, theme }),
    [autoMode, highContrastMode, setHighContrastMode, setTheme, theme],
  )

  return <Context value={value}>{children}</Context>
}

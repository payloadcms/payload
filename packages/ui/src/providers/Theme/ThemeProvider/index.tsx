'use client'
import React, { useCallback, useMemo } from 'react'

import type { ThemeProviderProps } from '../context.js'
import type { Theme } from '../shared.js'

import { useControllableState } from '../../../hooks/useControllableState.js'
import { Context, useTheme } from '../context.js'

/**
 * Theme providers can be nested to override the theme for part of the UI.
 * This provider manages local values; `RootThemeProvider` owns document preferences, cookies, and system detection.
 *
 * This provider also works without `RootThemeProvider`, e.g. for external UIs that should not access site-wide preferences or cookies.
 * `setTheme` updates local context and `data-theme` on the element referenced by `targetRef`.
 * It throws if `targetRef` is missing or its element is not mounted.
 *
 * `useTheme` reads and updates the local scope; use `useRootTheme` for root preferences.
 * Props override inherited values. Local setters require a mounted `targetRef` and throw without one.
 * Wrap the referenced element with this provider; no DOM element is added.
 *
 * @example
 * Inside a nested provider, `useTheme` reads that local scope; `useRootTheme` reads root preferences.
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

  /**
   * Sets the local theme and target's `data-theme`, leaving root preferences alone.
   * Requires a mounted `targetRef`; automatic mode belongs to `useRootTheme`.
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
   * Sets local contrast and the target flag, leaving root preferences alone.
   * Requires a mounted `targetRef`; inherited contrast styling still applies.
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

  const themePreference = targetRef ? localTheme : themeOverride
  const contrastPreference = targetRef ? localHighContrastMode : highContrastModeOverride
  const autoMode = themePreference === undefined ? parentContext.autoMode : false
  const theme = themePreference ?? parentContext.theme
  const highContrastMode = contrastPreference ?? parentContext.highContrastMode

  const value = useMemo(
    () => ({ autoMode, highContrastMode, setHighContrastMode, setTheme, theme }),
    [autoMode, highContrastMode, setHighContrastMode, setTheme, theme],
  )

  return <Context value={value}>{children}</Context>
}

/** Rejects missing local targets rather than falling through to the document root. @internal */
const getThemeTarget = ({
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

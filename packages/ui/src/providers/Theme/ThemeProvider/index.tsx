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
 * `useTheme` reads and updates the local scope; use `useRootTheme` for root preferences.
 * Props override inherited values. Local setters require a mounted `targetRef` and throw without one.
 * Wrap the referenced element with this provider; no DOM element is added.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  highContrastMode: highContrastModeOverride,
  targetRef,
  theme: themeOverride,
}) => {
  const parentContext = useTheme()
  const [localTheme, setLocalTheme] = useControllableState<'auto' | Theme | undefined>(
    themeOverride,
  )
  const [localHighContrastMode, setLocalHighContrastMode] =
    useControllableState(highContrastModeOverride)

  /**
   * Lets descendants change this scope independently of root preferences and cookies.
   * Updates context and the target's `data-theme` together so hook consumers and DOM styling stay aligned.
   * Requires a mounted `targetRef`; `'auto'` removes the local attribute and follows the parent context.
   */
  const setTheme = useCallback(
    (themeToSet: 'auto' | Theme) => {
      const target = getThemeTarget({ method: 'setTheme', targetRef })

      if (themeToSet === 'auto') {
        target.removeAttribute('data-theme')
      } else {
        target.setAttribute('data-theme', themeToSet)
      }

      setLocalTheme(themeToSet)
    },
    [setLocalTheme, targetRef],
  )

  /**
   * Gives this scope its own contrast setter, leaving root preferences and cookies unchanged.
   * Updates context and the target's `data-enhanced-contrast` flag together so consumers share the local choice.
   * Requires a mounted `targetRef`; removing the flag does not disable inherited document or shadow-host styling.
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
  const autoMode =
    themePreference === 'auto' || (themePreference === undefined ? parentContext.autoMode : false)
  const theme =
    themePreference === 'auto' ? parentContext.theme : (themePreference ?? parentContext.theme)
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

'use client'
import React, { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

import type { ThemeProviderProps } from './context.js'
import type { Theme } from './shared.js'

import { Context, useTheme } from './context.js'
import { createThemeTargetStore, getThemeTarget } from './utilities.js'

export type { ThemeContext } from './context.js'
export { useRootTheme, useTheme } from './context.js'
export { defaultTheme, type Theme } from './shared.js'

/**
 * Provides a local theme scope. Providers can be nested and do not add a DOM element.
 *
 * Wrap the themed element with this provider and pass its ref as `targetRef`.
 * Mount them together, or rerender the provider when a deferred target mounts so it can subscribe to the element.
 * Once mounted, the target's attributes determine the context, including changes made outside this provider.
 * `setTheme` writes only that element's `data-theme`; `'auto'` removes the override and inherits the surrounding theme.
 * `setHighContrastMode` toggles its `data-enhanced-contrast` flag; inherited contrast remains enabled.
 * Built-in enhanced contrast styling follows the document or shadow host; local flags need custom styling.
 *
 * Without `targetRef`, `theme` and `highContrastMode` are controlled context overrides, and omitted values inherit from the parent.
 * These props also supply fallback values before a target mounts.
 * Both setters throw if no ref is supplied or its element is not mounted; update controlled props instead.
 *
 * This provider never reads or writes cookies, detects system preferences, or changes `<html>`.
 * The Admin mounts `RootThemeProvider` for those responsibilities; use `useRootTheme` to change its preferences from within a local scope.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  highContrastMode,
  targetRef,
  theme,
}) => {
  const parentContext = useTheme()
  const targetStore = useMemo(() => createThemeTargetStore({ targetRef }), [targetRef])
  const targetState = useSyncExternalStore(
    targetStore.subscribe,
    targetStore.getSnapshot,
    getServerSnapshot,
  )

  useEffect(() => {
    // Ref objects keep their identity when React replaces the referenced element.
    targetStore.refresh()
  })

  const setTheme = useCallback(
    (themeToSet: 'auto' | Theme) => {
      const target = getThemeTarget({ method: 'setTheme', targetRef })

      if (themeToSet === 'auto') {
        target.removeAttribute('data-theme')
      } else {
        target.setAttribute('data-theme', themeToSet)
      }

      targetStore.refresh()
    },
    [targetRef, targetStore],
  )

  const setHighContrastMode = useCallback(
    (isHighContrast: boolean) => {
      getThemeTarget({ method: 'setHighContrastMode', targetRef }).toggleAttribute(
        'data-enhanced-contrast',
        isHighContrast,
      )
      targetStore.refresh()
    },
    [targetRef, targetStore],
  )

  const value = {
    autoMode: targetState?.autoMode ?? (theme === undefined ? parentContext.autoMode : false),
    highContrastMode:
      targetState?.highContrastMode ?? highContrastMode ?? parentContext.highContrastMode,
    setHighContrastMode,
    setTheme,
    theme: targetState
      ? (targetState.theme ?? parentContext.theme)
      : (theme ?? parentContext.theme),
  }

  // Keep the provider mounted as overrides change so descendants retain state and focus.
  return <Context value={value}>{children}</Context>
}

const getServerSnapshot = () => null

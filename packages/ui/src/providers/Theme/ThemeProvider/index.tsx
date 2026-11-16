'use client'
import React, { useCallback, useMemo } from 'react'

import type { ThemeProviderProps } from '../context.js'
import type { Theme } from '../shared.js'

import { useControllableState } from '../../../hooks/useControllableState.js'
import { Context, useTheme } from '../context.js'

/**
 * Provides a local theme scope. Providers can be nested and do not add a DOM element.
 * The props supply local values; omitted values inherit from the parent.
 *
 * To use the setters, wrap the themed element with this provider and pass its ref as `targetRef`.
 * Setters update local React state and only that element's attributes.
 * Both throw if no ref is supplied or its element is not mounted.
 * Without a ref, update the provider props to change the context.
 *
 * Local choices last until the corresponding prop changes.
 * Keep the element's attributes in sync when changing props; this provider does not read or observe DOM attributes.
 * `setTheme('auto')` removes the local attribute and follows the parent context, without detecting system preferences.
 * Local contrast flags need custom styling; built-in enhanced contrast follows the document or shadow host.
 *
 * Only the Admin's RootThemeProvider manages cookies, system preferences, and `<html>` attributes.
 * Use `useRootTheme` to read or change those preferences from within a local scope.
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

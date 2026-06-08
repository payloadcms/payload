'use client'
import React, { createContext, use } from 'react'

import type { Theme } from '../Theme/index.js'

import { useTheme } from '../Theme/index.js'

export type ComponentThemeContext = {
  highContrastMode: boolean
  theme: Theme
}

const Context = createContext<ComponentThemeContext | undefined>(undefined)

/**
 * Read-only scoped theme provider for UI components like Popup and Dialog.
 * Accepts an explicit `theme` prop and inherits `highContrastMode` from the
 * nearest global ThemeProvider. Has no setters — use `useTheme` for that.
 */
export const ComponentThemeProvider: React.FC<{
  children: React.ReactNode
  theme: Theme
}> = ({ children, theme }) => {
  const { highContrastMode } = useTheme()
  return <Context value={{ highContrastMode, theme }}>{children}</Context>
}

/**
 * Returns the nearest scoped ComponentThemeContext if one exists, otherwise
 * falls back to the global ThemeProvider context.
 */
export const useComponentTheme = (): ComponentThemeContext => {
  const scoped = use(Context)
  const global = useTheme()
  return scoped ?? global
}

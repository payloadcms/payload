'use client'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'

import type { EditViewWidth, Theme, TypeSize } from './shared.js'

import { useConfig } from '../Config/index.js'
import { useSearchParams } from '../RouterAdapter/index.js'
import { defaultTheme, getEditViewWidth, getTypeSize } from './shared.js'

export { defaultTheme, type Theme }

export type ThemeContext = {
  autoMode: boolean
  editViewWidth: EditViewWidth
  highContrastMode: boolean
  setEditViewHeaderAlignment: (args: { isEnabled: boolean }) => void
  setEditViewWidth: (args: { editViewWidth: EditViewWidth }) => void
  setHighContrastMode: (isHighContrast: boolean, options?: { scoped?: boolean }) => void
  setTheme: (theme: 'auto' | Theme, options?: { scoped?: boolean }) => void
  setTypeSize: (args: { typeSize: TypeSize }) => void
  shouldAlignEditViewHeader: boolean
  theme: Theme
  typeSize: TypeSize
}

const initialContext: ThemeContext = {
  autoMode: true,
  editViewWidth: 'full',
  highContrastMode: false,
  setEditViewHeaderAlignment: () => null,
  setEditViewWidth: () => null,
  setHighContrastMode: () => null,
  setTheme: () => null,
  setTypeSize: () => null,
  shouldAlignEditViewHeader: false,
  theme: 'light',
  typeSize: 'default',
}

const Context = createContext<ThemeContext | undefined>(undefined)

function setCookie(cname: string, cvalue: string, exdays: number) {
  const d = new Date()
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

const detectTheme = (cookieKey: string): { isAutoMode: boolean; theme: Theme } => {
  const fromCookie = window.document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${cookieKey}=`))
    ?.split('=')[1]

  const theme: Theme =
    fromCookie === 'light' || fromCookie === 'dark'
      ? fromCookie
      : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

  document.documentElement.setAttribute('data-theme', theme)

  return { isAutoMode: fromCookie !== 'light' && fromCookie !== 'dark', theme }
}

const detectHighContrastMode = (cookieKey: string): boolean => {
  const fromCookie =
    window.document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${cookieKey}=`))
      ?.split('=')[1] ?? null

  const isHighContrast =
    fromCookie === 'true'
      ? true
      : fromCookie === 'false'
        ? false
        : !!(window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches)

  if (isHighContrast) {
    document.documentElement.setAttribute('data-enhanced-contrast', '')
  } else {
    document.documentElement.removeAttribute('data-enhanced-contrast')
  }

  return isHighContrast
}

const isValidThemeParam = (value: null | string): value is 'auto' | Theme =>
  value === 'auto' || value === 'light' || value === 'dark'

/**
 * Provides theme context to its children.
 *
 * At the root (no parent ThemeProvider): reads/writes cookies, responds to
 * OS preference, owns setTheme and setHighContrastMode.
 *
 * When nested inside another ThemeProvider (e.g. inside a Popup): acts as a
 * scoped visual  the `theme` prop sets the local theme, but setThemeoverride
 * and setHighContrastMode bubble up through each level to the root provider so
 * mutations always affect the global user preference.
 *
 * The ThemeProvider also reads the `?theme=light|dark|auto` query parameter and
 * persists it to the theme cookie using the same mechanism as manual theme selection.
 */
export const ThemeProvider: React.FC<{
  children?: React.ReactNode
  editViewWidth?: EditViewWidth
  highContrastMode?: boolean
  shouldAlignEditViewHeader?: boolean
  theme?: Theme
  typeSize?: TypeSize
}> = ({
  children,
  editViewWidth: initialEditViewWidth = 'full',
  highContrastMode: initialHighContrastMode,
  shouldAlignEditViewHeader: initialHeaderAlignment = false,
  theme: themeOverride,
  typeSize: initialTypeSize = 'default',
}) => {
  const outerContext = use(Context)
  const isScoped = outerContext !== undefined

  const { config } = useConfig()
  const preselectedTheme = config.admin.theme
  const themeCookieKey = `${config.cookiePrefix || 'payload'}-theme`
  const contrastCookieKey = `${config.cookiePrefix || 'payload'}-high-contrast-mode`

  const editViewWidthCookieKey = `${config.cookiePrefix || 'payload'}-edit-view-width`
  const [editViewWidth, setEditViewWidthState] = useState<EditViewWidth>(initialEditViewWidth)

  const setEditViewWidth = useCallback(
    ({ editViewWidth: nextEditViewWidth }: { editViewWidth: EditViewWidth }) => {
      if (isScoped) {
        outerContext.setEditViewWidth({ editViewWidth: nextEditViewWidth })
        return
      }

      setEditViewWidthState(nextEditViewWidth)
      setCookie(editViewWidthCookieKey, nextEditViewWidth, 365)
      document.documentElement.setAttribute('data-edit-view-width', nextEditViewWidth)
    },
    [isScoped, outerContext, editViewWidthCookieKey],
  )

  useEffect(() => {
    if (isScoped) {
      return
    }

    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${editViewWidthCookieKey}=`))
      ?.split('=')[1]
    const detectedEditViewWidth = getEditViewWidth({ value })

    setEditViewWidthState(detectedEditViewWidth)
    document.documentElement.setAttribute('data-edit-view-width', detectedEditViewWidth)
  }, [isScoped, editViewWidthCookieKey])

  const headerAlignmentCookieKey = `${config.cookiePrefix || 'payload'}-edit-view-header-alignment`
  const [shouldAlignEditViewHeader, setHeaderAlignmentState] = useState(initialHeaderAlignment)

  const setEditViewHeaderAlignment = useCallback(
    ({ isEnabled }: { isEnabled: boolean }) => {
      if (isScoped) {
        outerContext.setEditViewHeaderAlignment({ isEnabled })
        return
      }

      setHeaderAlignmentState(isEnabled)
      setCookie(headerAlignmentCookieKey, String(isEnabled), 365)
    },
    [headerAlignmentCookieKey, isScoped, outerContext],
  )

  useEffect(() => {
    if (isScoped) {
      return
    }

    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${headerAlignmentCookieKey}=`))
      ?.split('=')[1]

    setHeaderAlignmentState(value === 'true')
  }, [headerAlignmentCookieKey, isScoped])

  const typeSizeCookieKey = `${config.cookiePrefix || 'payload'}-type-size`
  const [typeSize, setTypeSizeState] = useState<TypeSize>(initialTypeSize)

  const setTypeSize = useCallback(
    ({ typeSize: nextTypeSize }: { typeSize: TypeSize }) => {
      if (isScoped) {
        outerContext.setTypeSize({ typeSize: nextTypeSize })
        return
      }

      setTypeSizeState(nextTypeSize)
      setCookie(typeSizeCookieKey, nextTypeSize, 365)
      document.documentElement.setAttribute('data-type-size', nextTypeSize)
    },
    [isScoped, outerContext, typeSizeCookieKey],
  )

  useEffect(() => {
    if (isScoped) {
      return
    }

    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${typeSizeCookieKey}=`))
      ?.split('=')[1]
    const detectedTypeSize = getTypeSize({ value })

    setTypeSizeState(detectedTypeSize)
    document.documentElement.setAttribute('data-type-size', detectedTypeSize)
  }, [isScoped, typeSizeCookieKey])

  const themeParam = useSearchParams().get('theme')?.toLowerCase()

  const [theme, setThemeState] = useState<Theme>(themeOverride ?? defaultTheme)
  const [autoMode, setAutoMode] = useState<boolean>(!isScoped)
  const [highContrastMode, setHighContrastModeState] = useState<boolean>(
    isScoped ? (outerContext.highContrastMode ?? false) : (initialHighContrastMode ?? false),
  )

  // Setters bubble up to the root provider by default. Pass { scoped: true }
  // to update only the local (scoped) theme without affecting global state.
  const setTheme = useCallback(
    (themeToSet: 'auto' | Theme, options?: { scoped?: boolean }) => {
      if (isScoped && !options?.scoped) {
        outerContext.setTheme(themeToSet, options)
        return
      }
      const resolvedTheme: Theme =
        themeToSet === 'auto'
          ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : themeToSet

      setThemeState(resolvedTheme)
      setAutoMode(themeToSet === 'auto')

      if (!isScoped) {
        setCookie(themeCookieKey, themeToSet, themeToSet === 'auto' ? -1 : 365)
        document.documentElement.setAttribute('data-theme', resolvedTheme)
      }
    },
    [isScoped, outerContext, themeCookieKey],
  )

  const setHighContrastMode = useCallback(
    (isHighContrast: boolean, options?: { scoped?: boolean }) => {
      if (isScoped && !options?.scoped) {
        outerContext.setHighContrastMode(isHighContrast, options)
        return
      }
      setHighContrastModeState(isHighContrast)
      if (!isScoped) {
        setCookie(contrastCookieKey, String(isHighContrast), 365)
        if (isHighContrast) {
          document.documentElement.setAttribute('data-enhanced-contrast', '')
        } else {
          document.documentElement.removeAttribute('data-enhanced-contrast')
        }
      }
    },
    [isScoped, outerContext, contrastCookieKey],
  )

  // Keep highContrastMode in sync with the outer provider when scoped.
  useEffect(() => {
    if (isScoped) {
      setHighContrastModeState(outerContext.highContrastMode)
    }
  }, [isScoped, outerContext?.highContrastMode])

  // Resolve the root theme: a valid `?theme` param wins (applied via setTheme so
  // it persists to the theme cookie exactly like a manual selection; otherwise
  // fall back to the cookie or OS preference.
  useEffect(() => {
    if (isScoped || preselectedTheme !== 'all') {
      return
    }
    if (isValidThemeParam(themeParam)) {
      setTheme(themeParam)
      return
    }
    const { isAutoMode, theme: detectedTheme } = detectTheme(themeCookieKey)
    setThemeState(detectedTheme)
    setAutoMode(isAutoMode)
  }, [isScoped, preselectedTheme, themeCookieKey, themeParam, setTheme])

  useEffect(() => {
    if (isScoped) {
      return
    }
    setHighContrastModeState(detectHighContrastMode(contrastCookieKey))
  }, [isScoped, contrastCookieKey])

  return (
    <Context
      value={{
        autoMode: isScoped ? outerContext.autoMode : autoMode,
        editViewWidth: isScoped ? outerContext.editViewWidth : editViewWidth,
        highContrastMode,
        setEditViewHeaderAlignment,
        setEditViewWidth,
        setHighContrastMode,
        setTheme,
        setTypeSize,
        shouldAlignEditViewHeader: isScoped
          ? outerContext.shouldAlignEditViewHeader
          : shouldAlignEditViewHeader,
        theme: isScoped ? outerContext.theme : theme,
        typeSize: isScoped ? outerContext.typeSize : typeSize,
      }}
    >
      {children}
    </Context>
  )
}

export const useTheme = (): ThemeContext => use(Context) ?? initialContext

'use client'
import type { SanitizedConfig } from 'payload'

import React, { createContext, use, useCallback, useEffect, useEffectEvent, useState } from 'react'

import type { Theme } from './shared.js'

import { useConfig } from '../Config/index.js'
import { RouterAdapterContext } from '../RouterAdapter/index.js'
import { defaultTheme, resolveTheme } from './shared.js'

export { defaultTheme, type Theme }

export type ThemeContext = {
  autoMode: boolean
  highContrastMode: boolean
  setHighContrastMode: (isHighContrast: boolean, options?: { scoped?: boolean }) => void
  setTheme: (theme: 'auto' | Theme, options?: { scoped?: boolean }) => void
  theme: Theme
}

const initialContext: ThemeContext = {
  autoMode: true,
  highContrastMode: false,
  setHighContrastMode: () => null,
  setTheme: () => null,
  theme: 'light',
}

const Context = createContext<ThemeContext | undefined>(undefined)

/**
 * Shares theme state and setters inside or outside the admin panel.
 * Uses admin config and router contexts when present; external UIs can supply preferences directly.
 * Nested setters bubble to the root provider unless called with `{ scoped: true }`.
 */
export const ThemeProvider: React.FC<{
  children?: React.ReactNode
  cookiePrefix?: string
  highContrastMode?: boolean
  /** `null` means no saved preference; omitted values are read from the current document. */
  highContrastModeFromCookie?: null | string
  /** Disable when the current document does not share the admin's cookie origin. */
  shouldPersistPreferences?: boolean
  /** Receives theme attributes instead of `document.documentElement`; `null` waits for a target. */
  target?: HTMLElement | null
  theme?: Theme
  /** `null` means no saved preference; omitted values are read from the current document. */
  themeFromCookie?: null | string
  themeSettingFromConfig?: SanitizedConfig['admin']['theme']
}> = ({
  children,
  cookiePrefix,
  highContrastMode: initialHighContrastMode,
  highContrastModeFromCookie,
  shouldPersistPreferences = true,
  target,
  theme: themeOverride,
  themeFromCookie,
  themeSettingFromConfig,
}) => {
  const outerContext = use(Context)
  const isScoped = outerContext !== undefined

  const configContext = useConfig()
  const routerAdapter = use(RouterAdapterContext)
  const preselectedTheme = themeSettingFromConfig ?? configContext?.config.admin.theme ?? 'all'
  const resolvedCookiePrefix = cookiePrefix || configContext?.config.cookiePrefix || 'payload'
  const themeCookieKey = `${resolvedCookiePrefix}-theme`
  const contrastCookieKey = `${resolvedCookiePrefix}-high-contrast-mode`
  const themeTarget =
    target === undefined && typeof document !== 'undefined' ? document.documentElement : target

  const themeParam = routerAdapter?.searchParams.get('theme')?.toLowerCase()
  const initialTheme = resolveTheme({ themeFromCookie, themeSettingFromConfig: preselectedTheme })

  const [theme, setThemeState] = useState<Theme>(themeOverride ?? initialTheme.theme)
  const [autoMode, setAutoMode] = useState<boolean>(!isScoped && initialTheme.autoMode)
  const [highContrastMode, setHighContrastModeState] = useState<boolean>(() =>
    isScoped
      ? (outerContext.highContrastMode ?? false)
      : (initialHighContrastMode ?? resolveHighContrastMode({ highContrastModeFromCookie })),
  )

  // Setters bubble up to the root provider by default. Pass { scoped: true }
  // to update only the local (scoped) theme without affecting global state.
  const setTheme = useCallback(
    (themeToSet: 'auto' | Theme, options?: { scoped?: boolean }) => {
      if (isScoped && !options?.scoped) {
        outerContext.setTheme(themeToSet, options)
        return
      }
      const resolvedTheme = themeToSet === 'auto' ? getThemeFromSystem() : themeToSet

      setThemeState(resolvedTheme)
      setAutoMode(themeToSet === 'auto')

      if (!isScoped) {
        if (shouldPersistPreferences) {
          setCookie(themeCookieKey, themeToSet, themeToSet === 'auto' ? -1 : 365)
        }

        themeTarget?.setAttribute('data-theme', resolvedTheme)
      }
    },
    [isScoped, outerContext, shouldPersistPreferences, themeCookieKey, themeTarget],
  )

  const setHighContrastMode = useCallback(
    (isHighContrast: boolean, options?: { scoped?: boolean }) => {
      if (isScoped && !options?.scoped) {
        outerContext.setHighContrastMode(isHighContrast, options)
        return
      }
      setHighContrastModeState(isHighContrast)
      if (!isScoped) {
        if (shouldPersistPreferences) {
          setCookie(contrastCookieKey, String(isHighContrast), 365)
        }

        if (isHighContrast) {
          themeTarget?.setAttribute('data-enhanced-contrast', '')
        } else {
          themeTarget?.removeAttribute('data-enhanced-contrast')
        }
      }
    },
    [isScoped, outerContext, shouldPersistPreferences, contrastCookieKey, themeTarget],
  )

  const syncThemeTarget = useEffectEvent(() => {
    themeTarget?.setAttribute('data-theme', theme)
    themeTarget?.toggleAttribute('data-enhanced-contrast', highContrastMode)
  })

  useEffect(() => {
    if (isScoped || target === null) {
      return
    }

    if (target === undefined) {
      syncThemeTarget()
      return
    }

    const previousTheme = target.getAttribute('data-theme')
    const previousContrast = target.getAttribute('data-enhanced-contrast')

    syncThemeTarget()

    return () => {
      if (previousTheme === null) {
        target.removeAttribute('data-theme')
      } else {
        target.setAttribute('data-theme', previousTheme)
      }

      if (previousContrast === null) {
        target.removeAttribute('data-enhanced-contrast')
      } else {
        target.setAttribute('data-enhanced-contrast', previousContrast)
      }
    }
  }, [isScoped, target])

  // Keep highContrastMode in sync with the outer provider when scoped.
  useEffect(() => {
    if (isScoped) {
      setHighContrastModeState(outerContext.highContrastMode)
    }
  }, [isScoped, outerContext?.highContrastMode])

  const initializeTheme = useEffectEvent(() => {
    if (isScoped) {
      return
    }
    if (preselectedTheme === 'all' && isValidThemeParam(themeParam)) {
      setTheme(themeParam)
      return
    }

    const { autoMode: isAutoMode, theme: detectedTheme } = resolveTheme({
      themeFromCookie:
        themeFromCookie === undefined
          ? getThemeFromCookie({ cookieKey: themeCookieKey })
          : themeFromCookie,
      themeFromSystem: getThemeFromSystem(),
      themeSettingFromConfig: preselectedTheme,
    })

    themeTarget?.setAttribute('data-theme', detectedTheme)
    setThemeState(detectedTheme)
    setAutoMode(isAutoMode)
  })

  useEffect(() => {
    initializeTheme()
  }, [isScoped, preselectedTheme, themeCookieKey, themeFromCookie, themeParam])

  const initializeHighContrastMode = useEffectEvent(() => {
    if (isScoped) {
      return
    }
    const isHighContrast = resolveHighContrastMode({
      highContrastModeFromCookie:
        highContrastModeFromCookie === undefined
          ? getThemeFromCookie({ cookieKey: contrastCookieKey })
          : highContrastModeFromCookie,
      highContrastModeFromSystem: getHighContrastModeFromSystem(),
    })

    if (isHighContrast) {
      themeTarget?.setAttribute('data-enhanced-contrast', '')
    } else {
      themeTarget?.removeAttribute('data-enhanced-contrast')
    }

    setHighContrastModeState(isHighContrast)
  })

  useEffect(() => {
    initializeHighContrastMode()
  }, [isScoped, contrastCookieKey, highContrastModeFromCookie])

  return (
    <Context
      value={{
        autoMode: isScoped ? outerContext.autoMode : autoMode,
        highContrastMode,
        setHighContrastMode,
        setTheme,
        theme: isScoped ? outerContext.theme : theme,
      }}
    >
      {children}
    </Context>
  )
}

export const useTheme = (): ThemeContext => use(Context) ?? initialContext

const getThemeFromSystem = (): Theme => {
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

const getThemeFromCookie = ({ cookieKey }: { cookieKey: string }): string | undefined => {
  if (typeof document === 'undefined') {
    return undefined
  }

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${cookieKey}=`))
    ?.split('=')[1]
}

/** Priority: cookie, system preference, then disabled. */
const resolveHighContrastMode = ({
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

const getHighContrastModeFromSystem = (): boolean => {
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

const isValidThemeParam = (value: null | string): value is 'auto' | Theme =>
  value === 'auto' || value === 'light' || value === 'dark'

function setCookie(cname: string, cvalue: string, exdays: number) {
  const d = new Date()
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

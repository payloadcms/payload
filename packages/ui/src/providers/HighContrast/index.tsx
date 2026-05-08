'use client'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'

import { useConfig } from '../Config/index.js'

export type HighContrastMode = 'off' | 'on'

export type HighContrastContext = {
  autoMode: boolean
  highContrastMode: HighContrastMode
  setHighContrastMode: (mode: 'auto' | HighContrastMode) => void
}

const initialContext: HighContrastContext = {
  autoMode: true,
  highContrastMode: 'off',
  setHighContrastMode: () => null,
}

const Context = createContext(initialContext)

function setCookie(cname: string, cvalue: string, exdays: number) {
  const d = new Date()
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

const getHighContrastMode = (
  cookieKey: string,
): {
  highContrastMode: HighContrastMode
  modeFromCookies: null | string
} => {
  const modeFromCookies =
    window.document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${cookieKey}=`))
      ?.split('=')[1] ?? null

  let highContrastMode: HighContrastMode

  if (modeFromCookies === 'on' || modeFromCookies === 'off') {
    highContrastMode = modeFromCookies
  } else {
    highContrastMode =
      window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches ? 'on' : 'off'
  }

  if (highContrastMode === 'on') {
    document.documentElement.setAttribute('data-enhanced-contrast', '')
  } else {
    document.documentElement.removeAttribute('data-enhanced-contrast')
  }

  return { highContrastMode, modeFromCookies }
}

export const defaultHighContrastMode: HighContrastMode = 'off'

export const HighContrastProvider: React.FC<{
  children?: React.ReactNode
  highContrastMode?: HighContrastMode
}> = ({ children, highContrastMode: initialMode }) => {
  const { config } = useConfig()
  const cookieKey = `${config.cookiePrefix || 'payload'}-high-contrast-mode`

  const [highContrastMode, setHighContrastModeState] = useState<HighContrastMode>(
    initialMode || defaultHighContrastMode,
  )
  const [autoMode, setAutoMode] = useState<boolean>(true)

  useEffect(() => {
    const { highContrastMode: detectedMode, modeFromCookies } = getHighContrastMode(cookieKey)
    setHighContrastModeState(detectedMode)
    setAutoMode(!modeFromCookies)
  }, [cookieKey])

  const setHighContrastMode = useCallback(
    (modeToSet: 'auto' | HighContrastMode) => {
      if (modeToSet === 'on' || modeToSet === 'off') {
        setHighContrastModeState(modeToSet)
        setAutoMode(false)
        setCookie(cookieKey, modeToSet, 365)
        if (modeToSet === 'on') {
          document.documentElement.setAttribute('data-enhanced-contrast', '')
        } else {
          document.documentElement.removeAttribute('data-enhanced-contrast')
        }
      } else if (modeToSet === 'auto') {
        setCookie(cookieKey, modeToSet, -1)
        const modeFromOS =
          window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches ? 'on' : 'off'
        if (modeFromOS === 'on') {
          document.documentElement.setAttribute('data-enhanced-contrast', '')
        } else {
          document.documentElement.removeAttribute('data-enhanced-contrast')
        }
        setAutoMode(true)
        setHighContrastModeState(modeFromOS)
      }
    },
    [cookieKey],
  )

  return <Context value={{ autoMode, highContrastMode, setHighContrastMode }}>{children}</Context>
}

export const useHighContrast = (): HighContrastContext => use(Context)

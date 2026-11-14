'use client'

import React, { useSyncExternalStore } from 'react'

import { defaultTheme, themeLocalStorageKey } from '../shared'

const themeScript = `
  (function () {
    function getImplicitPreference() {
      var mediaQuery = '(prefers-color-scheme: dark)'
      var mql = window.matchMedia(mediaQuery)
      var hasImplicitPreference = typeof mql.matches === 'boolean'

      if (hasImplicitPreference) {
        return mql.matches ? 'dark' : 'light'
      }

      return null
    }

    function themeIsValid(theme) {
      return theme === 'light' || theme === 'dark'
    }

    var themeToSet = '${defaultTheme}'
    var preference = window.localStorage.getItem('${themeLocalStorageKey}')

    if (themeIsValid(preference)) {
      themeToSet = preference
    } else {
      var implicitPreference = getImplicitPreference()

      if (implicitPreference) {
        themeToSet = implicitPreference
      }
    }

    document.documentElement.setAttribute('data-theme', themeToSet)
  })();
  `

const subscribe = () => () => {}

export const InitTheme: React.FC = () => {
  // true during SSR and hydration, false when React renders this fresh on the client.
  // The latter happens e.g. on a notFound() page, where Next sends an error shell and
  // renders the root layout client-side. Scripts created on the client never execute
  // (React warns about this), and ThemeProvider applies the theme in that case anyway.
  const isServerRendered = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  )

  if (!isServerRendered) return null

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} id="theme-script" />
}

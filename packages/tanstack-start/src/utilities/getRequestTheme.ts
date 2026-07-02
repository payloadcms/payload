import type { Theme } from '@payloadcms/ui'
import type { SanitizedConfig } from 'payload'

type GetRequestThemeArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
  headers: Headers
}

// Defined locally rather than imported from `@payloadcms/ui` (a `'use client'`
// barrel) because its value exports resolve to non-serializable client
// references in this adapter's RSC server context. `Theme` is a type-only
// import and is safely erased at runtime.
const defaultTheme: Theme = 'light'

const acceptedThemes: Theme[] = ['dark', 'light']

export function getRequestTheme({ config, cookies, headers }: GetRequestThemeArgs): Theme {
  if (config.admin.theme !== 'all' && acceptedThemes.includes(config.admin.theme)) {
    return config.admin.theme
  }

  const themeCookie = cookies.get(`${config.cookiePrefix || 'payload'}-theme`)

  if (themeCookie && acceptedThemes.includes(themeCookie as Theme)) {
    return themeCookie as Theme
  }

  const themeFromHeader = headers.get('Sec-CH-Prefers-Color-Scheme') as Theme

  if (themeFromHeader && acceptedThemes.includes(themeFromHeader)) {
    return themeFromHeader
  }

  return defaultTheme
}

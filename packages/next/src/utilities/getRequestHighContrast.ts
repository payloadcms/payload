import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js'
import type { SanitizedConfig } from 'payload'

export type HighContrastMode = 'off' | 'on'

export const defaultHighContrastMode: HighContrastMode = 'off'

type GetRequestHighContrastArgs = {
  config: SanitizedConfig
  cookies: Map<string, string> | ReadonlyRequestCookies
  headers: Request['headers']
}

export const getRequestHighContrast = ({
  config,
  cookies,
  headers,
}: GetRequestHighContrastArgs): HighContrastMode => {
  const cookieKey = `${config.cookiePrefix || 'payload'}-high-contrast-mode`
  const modeCookie = cookies.get(cookieKey)

  const modeFromCookie: HighContrastMode = (
    typeof modeCookie === 'string' ? modeCookie : modeCookie?.value
  ) as HighContrastMode

  if (modeFromCookie === 'on' || modeFromCookie === 'off') {
    return modeFromCookie
  }

  const contrastHeader = headers.get('Sec-CH-Prefers-Contrast')

  if (contrastHeader === 'more' || contrastHeader === 'forced') {
    return 'on'
  }

  return defaultHighContrastMode
}

import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js'
import type { SanitizedConfig } from 'payload'

type GetRequestHighContrastArgs = {
  config: SanitizedConfig
  cookies: Map<string, string> | ReadonlyRequestCookies
  headers: Request['headers']
}

export const getRequestHighContrast = ({
  config,
  cookies,
  headers,
}: GetRequestHighContrastArgs): boolean => {
  const cookieKey = `${config.cookiePrefix || 'payload'}-high-contrast-mode`
  const modeCookie = cookies.get(cookieKey)

  const modeFromCookie = typeof modeCookie === 'string' ? modeCookie : modeCookie?.value

  if (modeFromCookie === 'true') {
    return true
  }
  if (modeFromCookie === 'false') {
    return false
  }

  const contrastHeader = headers.get('Sec-CH-Prefers-Contrast')

  return contrastHeader === 'more' || contrastHeader === 'forced'
}

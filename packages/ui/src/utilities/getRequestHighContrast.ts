import type { SanitizedConfig } from 'payload'

import { highContrastModeCookieSuffix } from '../providers/Theme/shared.js'

type GetRequestHighContrastArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
  headers: Request['headers']
}

/**
 * The request input used to resolve enhanced contrast.
 * `'fallback'` means no usable cookie or client hint was available; the browser may still resolve the system preference.
 */
export type RequestHighContrastSource =
  | 'fallback'
  | keyof Omit<GetRequestHighContrastArgs, 'config'>

export type RequestHighContrastResult = {
  /** The request's resolved enhanced contrast preference. */
  highContrastMode: boolean
  /** The input used to resolve enhanced contrast. */
  highContrastModeSource: RequestHighContrastSource
}

/** @internal */
export const getRequestHighContrast = ({
  config,
  cookies,
  headers,
}: GetRequestHighContrastArgs): RequestHighContrastResult => {
  const cookieKey = `${config.cookiePrefix}${highContrastModeCookieSuffix}`
  const modeFromCookie = cookies.get(cookieKey)

  if (modeFromCookie === 'true' || modeFromCookie === 'false') {
    return { highContrastMode: modeFromCookie === 'true', highContrastModeSource: 'cookies' }
  }

  const contrastHeader = headers.get('Sec-CH-Prefers-Contrast')?.replace(/^"(.*)"$/, '$1')

  switch (contrastHeader) {
    case 'custom':
    case 'less':
    case 'no-preference':
      return { highContrastMode: false, highContrastModeSource: 'headers' }
    case 'forced':
    case 'more':
      return { highContrastMode: true, highContrastModeSource: 'headers' }
    default:
      return { highContrastMode: false, highContrastModeSource: 'fallback' }
  }
}

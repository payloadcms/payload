import type { SanitizedConfig } from 'payload'

type GetRequestHighContrastArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
  headers: Request['headers']
}

export const getRequestHighContrast = ({
  config,
  cookies,
  headers,
}: GetRequestHighContrastArgs): boolean => {
  const cookieKey = `${config.cookiePrefix || 'payload'}-high-contrast-mode`
  const modeFromCookie = cookies.get(cookieKey)

  if (modeFromCookie === 'true') {
    return true
  }
  if (modeFromCookie === 'false') {
    return false
  }

  const contrastHeader = headers.get('Sec-CH-Prefers-Contrast')

  return contrastHeader === 'more' || contrastHeader === 'forced'
}

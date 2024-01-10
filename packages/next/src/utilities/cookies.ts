import type { Payload, SanitizedCollectionConfig } from 'payload/types'

type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  name: string
  path?: string
  sameSite?: 'Lax' | 'None' | 'Strict'
  secure?: boolean
  value?: string
}

export const generateCookies = (cookies: CookieOptions[]): string => {
  return cookies.map((options) => generateCookie(options)).join('; ')
}

export const generateCookie = (args: CookieOptions): string => {
  const { name, domain, expires, httpOnly, maxAge, path, sameSite, secure: secureArg, value } = args

  let cookieString = `${name}=${value || ''}`

  const secure = secureArg || sameSite === 'None'

  if (expires) {
    cookieString += `; Expires=${expires.toUTCString()}`
  }

  if (maxAge) {
    cookieString += `; Max-Age=${maxAge}`
  }

  if (domain) {
    cookieString += `; Domain=${domain}`
  }

  if (path) {
    cookieString += `; Path=${path}`
  }

  if (secure) {
    cookieString += '; Secure'
  }

  if (httpOnly) {
    cookieString += '; HttpOnly'
  }

  if (sameSite) {
    cookieString += `; SameSite=${sameSite}`
  }

  return cookieString
}

type GetCookieExpirationArgs = {
  /*
    The number of seconds until the cookie expires
    @default 7200 seconds (2 hours)
  */
  seconds: number
}
const getCookieExpiration = ({ seconds = 7200 }: GetCookieExpirationArgs) => {
  const currentTime = new Date()
  currentTime.setSeconds(currentTime.getSeconds() + seconds)
  return currentTime
}

type GeneratePayloadCookieArgs = {
  /* The auth collection config */
  collectionConfig: SanitizedCollectionConfig
  /* An instance of payload */
  payload: Payload
  /* The token to be stored in the cookie */
  token: string
}
export const generatePayloadCookie = ({
  collectionConfig,
  payload,
  token,
}: GeneratePayloadCookieArgs): string => {
  const sameSite =
    typeof collectionConfig.auth.cookies.sameSite === 'string'
      ? collectionConfig.auth.cookies.sameSite
      : collectionConfig.auth.cookies.sameSite
      ? 'Strict'
      : undefined

  return generateCookie({
    name: `${payload.config.cookiePrefix}-token`,
    domain: collectionConfig.auth.cookies.domain ?? undefined,
    expires: getCookieExpiration({ seconds: collectionConfig.auth.tokenExpiration }),
    httpOnly: true,
    path: '/',
    sameSite,
    secure: collectionConfig.auth.cookies.secure,
    value: token,
  })
}

export const generateExpiredPayloadCookie = ({
  collectionConfig,
  payload,
}: Omit<GeneratePayloadCookieArgs, 'token'>): string => {
  const sameSite =
    typeof collectionConfig.auth.cookies.sameSite === 'string'
      ? collectionConfig.auth.cookies.sameSite
      : collectionConfig.auth.cookies.sameSite
      ? 'Strict'
      : undefined

  const expires = new Date(Date.now() - 1000)

  return generateCookie({
    name: `${payload.config.cookiePrefix}-token`,
    domain: collectionConfig.auth.cookies.domain ?? undefined,
    expires,
    httpOnly: true,
    path: '/',
    sameSite,
    secure: collectionConfig.auth.cookies.secure,
  })
}

export const parseCookies = (headers: Request['headers']): Map<string, string> => {
  const cookieMap = new Map<string, string>()
  const cookie = headers.get('Cookie')

  if (cookie) {
    cookie.split(';').forEach((cookie) => {
      const parts = cookie.split('=')
      const key = parts.shift().trim()
      const encodedValue = parts.join('=')

      try {
        const decodedValue = decodeURI(encodedValue)
        cookieMap.set(key, decodedValue)
      } catch (e) {
        return null
      }
    })
  }

  return cookieMap
}

// @ts-strict-ignore
import type { SanitizedCollectionConfig } from './../collections/config/types.js'

type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  name: string
  path?: string
  returnCookieAsObject: boolean
  sameSite?: 'Lax' | 'None' | 'Strict'
  secure?: boolean
  value?: string
}

type CookieObject = {
  domain?: string
  expires?: string
  httpOnly?: boolean
  maxAge?: number
  name: string
  path?: string
  sameSite?: 'Lax' | 'None' | 'Strict'
  secure?: boolean
  value: string | undefined
}

export const generateCookie = <ReturnCookieAsObject = boolean>(
  args: CookieOptions,
): ReturnCookieAsObject extends true ? CookieObject : string => {
  const {
    name,
    domain,
    expires,
    httpOnly,
    maxAge,
    path,
    returnCookieAsObject,
    sameSite,
    secure: secureArg,
    value,
  } = args

  let cookieString = `${name}=${value || ''}`
  const cookieObject: CookieObject = {
    name,
    value,
  }

  const secure = secureArg || sameSite === 'None'

  if (expires) {
    if (returnCookieAsObject) {
      cookieObject.expires = expires.toUTCString()
    } else {
      cookieString += `; Expires=${expires.toUTCString()}`
    }
  }

  if (maxAge) {
    if (returnCookieAsObject) {
      cookieObject.maxAge = maxAge
    } else {
      cookieString += `; Max-Age=${maxAge.toString()}`
    }
  }

  if (domain) {
    if (returnCookieAsObject) {
      cookieObject.domain = domain
    } else {
      cookieString += `; Domain=${domain}`
    }
  }

  if (path) {
    if (returnCookieAsObject) {
      cookieObject.path = path
    } else {
      cookieString += `; Path=${path}`
    }
  }

  if (secure) {
    if (returnCookieAsObject) {
      cookieObject.secure = secure
    } else {
      cookieString += `; Secure=${secure}`
    }
  }

  if (httpOnly) {
    if (returnCookieAsObject) {
      cookieObject.httpOnly = httpOnly
    } else {
      cookieString += `; HttpOnly=${httpOnly}`
    }
  }

  if (sameSite) {
    if (returnCookieAsObject) {
      cookieObject.sameSite = sameSite
    } else {
      cookieString += `; SameSite=${sameSite}`
    }
  }

  return (returnCookieAsObject ? cookieObject : cookieString) as ReturnCookieAsObject extends true
    ? CookieObject
    : string
}
type GetCookieExpirationArgs = {
  /*
    The number of seconds until the cookie expires
    @default 7200 seconds (2 hours)
  */
  seconds: number
}
export const getCookieExpiration = ({ seconds = 7200 }: GetCookieExpirationArgs) => {
  const currentTime = new Date()
  currentTime.setSeconds(currentTime.getSeconds() + seconds)
  return currentTime
}

type GeneratePayloadCookieArgs = {
  /* The auth collection config */
  collectionAuthConfig: SanitizedCollectionConfig['auth']
  /* Prefix to scope the cookie */
  cookiePrefix: string
  /* The returnAs value */
  returnCookieAsObject?: boolean
  /* The token to be stored in the cookie */
  token: string
}
export const generatePayloadCookie = <T extends GeneratePayloadCookieArgs>({
  collectionAuthConfig,
  cookiePrefix,
  returnCookieAsObject = false,
  token,
}: T): T['returnCookieAsObject'] extends true ? CookieObject : string => {
  const sameSite =
    typeof collectionAuthConfig.cookies.sameSite === 'string'
      ? collectionAuthConfig.cookies.sameSite
      : collectionAuthConfig.cookies.sameSite
        ? 'Strict'
        : undefined

  return generateCookie<T['returnCookieAsObject']>({
    name: `${cookiePrefix}-token`,
    domain: collectionAuthConfig.cookies.domain ?? undefined,
    expires: getCookieExpiration({ seconds: collectionAuthConfig.tokenExpiration }),
    httpOnly: true,
    path: '/',
    returnCookieAsObject,
    sameSite,
    secure: collectionAuthConfig.cookies.secure,
    value: token,
  })
}

export const generateExpiredPayloadCookie = <T extends Omit<GeneratePayloadCookieArgs, 'token'>>({
  collectionAuthConfig,
  cookiePrefix,
  returnCookieAsObject = false,
}: T): T['returnCookieAsObject'] extends true ? CookieObject : string => {
  const sameSite =
    typeof collectionAuthConfig.cookies.sameSite === 'string'
      ? collectionAuthConfig.cookies.sameSite
      : collectionAuthConfig.cookies.sameSite
        ? 'Strict'
        : undefined

  const expires = new Date(Date.now() - 1000)

  return generateCookie<T['returnCookieAsObject']>({
    name: `${cookiePrefix}-token`,
    domain: collectionAuthConfig.cookies.domain ?? undefined,
    expires,
    httpOnly: true,
    path: '/',
    returnCookieAsObject,
    sameSite,
    secure: collectionAuthConfig.cookies.secure,
  })
}

export const parseCookies = (headers: Request['headers']): Map<string, string> => {
  const cookieMap = new Map<string, string>()
  const cookie = headers.get('Cookie')

  if (cookie) {
    cookie.split(';').forEach((cookie) => {
      const parts = cookie.split('=')
      const key = parts.shift()?.trim()
      const encodedValue = parts.join('=')

      try {
        const decodedValue = decodeURI(encodedValue)
        cookieMap.set(key, decodedValue)
      } catch (ignore) {
        return null
      }
    })
  }

  return cookieMap
}

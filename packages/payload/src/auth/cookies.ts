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

export function parseCookies(headers: Request['headers']) {
  // Taken from https://github.com/vercel/edge-runtime/blob/main/packages/cookies/src/serialize.ts

  /*
  The MIT License (MIT)

  Copyright (c) 2024 Vercel, Inc.

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */
  const map = new Map<string, string>()

  const cookie = headers.get('Cookie')

  if (!cookie) {
    return map
  }

  for (const pair of cookie.split(/; */)) {
    if (!pair) {
      continue
    }

    const splitAt = pair.indexOf('=')

    // If the attribute doesn't have a value, set it to 'true'.
    if (splitAt === -1) {
      map.set(pair, 'true')
      continue
    }

    // Otherwise split it into key and value and trim the whitespace on the
    // value.
    const [key, value] = [pair.slice(0, splitAt), pair.slice(splitAt + 1)]
    try {
      map.set(key, decodeURIComponent(value ?? 'true'))
    } catch {
      // ignore invalid encoded values
    }
  }

  return map
}

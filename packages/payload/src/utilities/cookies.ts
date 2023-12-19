type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  name: string
  path?: string
  sameSite?: 'Lax' | 'None' | 'Strict'
  secure?: boolean
  value: string
}

export const generateCookies = (cookies: CookieOptions[]): string => {
  return cookies.map((options) => generateCookie(options)).join('; ')
}

export const generateCookie = (args: CookieOptions): string => {
  const { name, domain, expires, httpOnly, maxAge, path, sameSite, secure: secureArg, value } = args

  let cookieString = `${name}=${value}`

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

import { APIError } from '../errors'

export const parseCookies = (headers: Request['headers']): Map<string, string> => {
  const list = new Map<string, string>()
  const rc = headers.get('Cookie')

  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=')
      const key = parts.shift().trim()
      const encodedValue = parts.join('=')

      try {
        const decodedValue = decodeURI(encodedValue)
        list.set(key, decodedValue)
      } catch (e) {
        throw new APIError(`Error decoding cookie value for key ${key}: ${e.message}`)
      }
    })
  }

  return list
}

import type { Auth } from 'payload'

import { setResponseHeader } from '@tanstack/react-start/server'
import { generatePayloadCookie } from 'payload'

type SetPayloadAuthCookieArgs = {
  authConfig: Auth
  cookiePrefix: string
  token: string
}

export function setPayloadAuthCookie({
  authConfig,
  cookiePrefix,
  token,
}: SetPayloadAuthCookieArgs): void {
  const cookieExpiration = authConfig.tokenExpiration
    ? new Date(Date.now() + authConfig.tokenExpiration)
    : undefined

  const payloadCookie = generatePayloadCookie({
    collectionAuthConfig: authConfig,
    cookiePrefix,
    expires: cookieExpiration,
    returnCookieAsObject: true,
    token,
  })

  if (payloadCookie.value) {
    const sameSite =
      typeof authConfig.cookies.sameSite === 'string' ? authConfig.cookies.sameSite : 'Lax'

    let cookie = `${encodeURIComponent(payloadCookie.name)}=${encodeURIComponent(payloadCookie.value)}`
    cookie += '; HttpOnly'
    cookie += `; SameSite=${sameSite}`
    cookie += '; Path=/'

    if (authConfig.cookies.secure) {
      cookie += '; Secure'
    }

    if (authConfig.cookies.domain) {
      cookie += `; Domain=${authConfig.cookies.domain}`
    }

    if (payloadCookie.expires) {
      cookie += `; Expires=${new Date(payloadCookie.expires).toUTCString()}`
    }

    setResponseHeader('Set-Cookie', cookie)
  }
}

import type { Auth } from '@ruya.sa/payload'

import { cookies as getCookies } from 'next/headers.js'
import { generatePayloadCookie } from '@ruya.sa/payload'

type SetPayloadAuthCookieArgs = {
  authConfig: Auth
  cookiePrefix: string
  token: string
}

export async function setPayloadAuthCookie({
  authConfig,
  cookiePrefix,
  token,
}: SetPayloadAuthCookieArgs): Promise<void> {
  const cookies = await getCookies()

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
    cookies.set(payloadCookie.name, payloadCookie.value, {
      domain: authConfig.cookies.domain,
      expires: payloadCookie.expires ? new Date(payloadCookie.expires) : undefined,
      httpOnly: true,
      sameSite: (typeof authConfig.cookies.sameSite === 'string'
        ? authConfig.cookies.sameSite.toLowerCase()
        : 'lax') as 'lax' | 'none' | 'strict',
      secure: authConfig.cookies.secure || false,
    })
  }
}

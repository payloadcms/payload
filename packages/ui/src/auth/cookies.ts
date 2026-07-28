import type { Auth, CookieOptions, ServerAdapter } from 'payload'

import { generateExpiredPayloadCookie, generatePayloadCookie } from 'payload'

/**
 * Object form returned by `generatePayloadCookie`/`generateExpiredPayloadCookie`
 * when `returnCookieAsObject` is `true`. Payload does not export the type.
 */
type GeneratedCookie = {
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

// `generateCookie` emits capitalized `SameSite` values (as they appear in the
// header); `CookieOptions` takes the lowercase form.
const toCookieOptions = (cookie: GeneratedCookie): CookieOptions => ({
  domain: cookie.domain,
  expires: cookie.expires ? new Date(cookie.expires) : undefined,
  httpOnly: cookie.httpOnly,
  maxAge: cookie.maxAge,
  path: cookie.path,
  sameSite: cookie.sameSite?.toLowerCase() as CookieOptions['sameSite'],
  secure: cookie.secure,
})

type AuthCookieArgs = {
  authConfig: Auth
  cookiePrefix: string
  serverAdapter: ServerAdapter
}

/** Writes the Payload auth cookie for `token` through the framework's cookie API. */
export async function setAuthCookie({
  authConfig,
  cookiePrefix,
  serverAdapter,
  token,
}: { token: string } & AuthCookieArgs): Promise<void> {
  const cookie = generatePayloadCookie({
    collectionAuthConfig: authConfig,
    cookiePrefix,
    returnCookieAsObject: true,
    token,
  }) as GeneratedCookie

  if (!cookie.value) {
    return
  }

  await serverAdapter.setCookie(cookie.name, cookie.value, toCookieOptions(cookie))
}

/**
 * Expires the Payload auth cookie. Written with the same `domain`/`path`/`secure`
 * attributes it was set with — a mismatched `domain` leaves the original cookie
 * in place.
 */
export async function clearAuthCookie({
  authConfig,
  cookiePrefix,
  serverAdapter,
}: AuthCookieArgs): Promise<void> {
  const cookie = generateExpiredPayloadCookie({
    collectionAuthConfig: authConfig,
    cookiePrefix,
    returnCookieAsObject: true,
  }) as GeneratedCookie

  await serverAdapter.setCookie(cookie.name, '', toCookieOptions(cookie))
}

/** Reads the request's existing Payload auth cookie, if any. */
export async function getExistingAuthToken({
  cookiePrefix,
  serverAdapter,
}: {
  cookiePrefix: string
  serverAdapter: ServerAdapter
}): Promise<{ name: string; value: string } | undefined> {
  const store = await serverAdapter.getCookies()
  const allCookies = store.getAll?.()

  if (allCookies) {
    return allCookies.find((cookie) => cookie.name.startsWith(cookiePrefix))
  }

  return store.get(`${cookiePrefix}-token`) ?? undefined
}

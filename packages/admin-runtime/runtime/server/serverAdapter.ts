import type { CookieOptions, CookieStore, ServerAdapter } from 'payload'

import { parseCookies } from 'payload'
import { generateCookie } from 'payload/shared'

export type NavIntent = {
  type?: 'forbidden' | 'notFound' | 'redirect' | 'unauthorized'
  url?: string
}

const NAVIGATION_ERROR = 'payload-admin-navigation'

export const isNavigationError = (error: unknown) =>
  error instanceof Error && error.message === NAVIGATION_ERROR

/**
 * A framework-free `ServerAdapter` backed by the incoming `Request`. Navigation records its intent
 * before throwing: React swallows errors thrown deep inside a streamed server component, so the
 * handler reads `nav` once rendering is done.
 */
export function createRequestServerAdapter({
  nav,
  request,
  responseCookies,
}: {
  nav: NavIntent
  request: Request
  responseCookies: string[]
}): ServerAdapter {
  const cookies = parseCookies(request.headers)

  const setCookie = (name: string, value: string, options: CookieOptions = {}) => {
    cookies.set(name, value)
    responseCookies.push(
      generateCookie<false>({
        ...options,
        name,
        path: options.path ?? '/',
        returnCookieAsObject: false,
        sameSite: options.sameSite
          ? (`${options.sameSite[0]!.toUpperCase()}${options.sameSite.slice(1)}` as 'Lax')
          : undefined,
        value,
      }),
    )
  }

  const cookieStore: CookieStore = {
    get: (name) => {
      const value = cookies.get(name)
      return value === undefined ? undefined : { name, value }
    },
    getAll: () => Array.from(cookies, ([name, value]) => ({ name, value })),
    set: setCookie,
  }

  const navigate = (intent: NavIntent): never => {
    Object.assign(nav, intent)
    throw new Error(NAVIGATION_ERROR)
  }

  return {
    forbidden: () => navigate({ type: 'forbidden' }),
    getCookies: () => cookieStore,
    getHeaders: () => request.headers,
    notFound: () => navigate({ type: 'notFound' }),
    permanentRedirect: (url) => navigate({ type: 'redirect', url }),
    redirect: (url) => navigate({ type: 'redirect', url }),
    setCookie,
    unauthorized: () => navigate({ type: 'unauthorized' }),
  }
}

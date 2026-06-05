import type { CookieOptions, CookieStore, ServerAdapter } from 'payload'

import { notFound, redirect } from '@tanstack/react-router'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'
import { parseCookies } from 'payload'

function buildCookieStore(headers: Headers): CookieStore {
  const cookies = parseCookies(headers)

  return {
    get: (name: string) => {
      const value = cookies.get(name)
      return value !== undefined ? { name, value } : undefined
    },
    getAll: () => {
      return Array.from(cookies.entries()).map(([name, value]) => ({ name, value }))
    },
  }
}

function serializeCookie(name: string, value: string, options?: CookieOptions): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  if (options?.path) {
    cookie += `; Path=${options.path}`
  }

  if (options?.domain) {
    cookie += `; Domain=${options.domain}`
  }

  if (options?.maxAge !== undefined) {
    cookie += `; Max-Age=${options.maxAge}`
  }

  if (options?.expires) {
    cookie += `; Expires=${options.expires.toUTCString()}`
  }

  if (options?.httpOnly) {
    cookie += '; HttpOnly'
  }

  if (options?.secure) {
    cookie += '; Secure'
  }

  if (options?.sameSite) {
    cookie += `; SameSite=${options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)}`
  }

  return cookie
}

/**
 * Server-side adapter for TanStack Start.
 * Uses `@tanstack/react-start/server` utilities for request/response handling.
 */
export const tanstackServerAdapter: ServerAdapter = {
  getCookies: () => {
    const request = getRequest()
    const headers = new Headers(request.headers)
    return buildCookieStore(headers)
  },

  getHeaders: () => {
    const request = getRequest()
    return new Headers(request.headers)
  },

  notFound: () => {
    // TanStack Router requires throwing the notFound() result directly
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound()
  },

  redirect: (path: string) => {
    // TanStack Router requires throwing the redirect() result directly
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: path })
  },

  permanentRedirect: (path: string) => {
    // TanStack Router does not have a separate permanent redirect primitive;
    // fall back to a regular redirect so existing behavior is preserved.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: path })
  },

  forbidden: () => {
    // TanStack Router does not have a dedicated forbidden() helper; surface
    // a generic error so the request boundary still terminates the request.
    throw new Error('Forbidden')
  },

  unauthorized: () => {
    // TanStack Router does not have a dedicated unauthorized() helper; surface
    // a generic error so the request boundary still terminates the request.
    throw new Error('Unauthorized')
  },

  setCookie: (name: string, value: string, options?: CookieOptions) => {
    setResponseHeader('Set-Cookie', serializeCookie(name, value, options))
  },
}

/**
 * Navigation requested during an admin page render, recorded by
 * `createPageRenderServerAdapter`. The admin-page server function reads this
 * after `renderServerComponent` resolves.
 */
export type PageNavIntent = {
  type?: 'notFound' | 'redirect'
  url?: string
}

/**
 * Builds the `ServerAdapter` for the admin page render (`renderRoot`). Like
 * `tanstackServerAdapter` for cookies/headers, but navigation **records the
 * intent on `nav` and throws** the framework-agnostic string error-contract
 * (`Error('not-found')` / `Error('redirect:<url>')`) instead of TanStack's
 * native `notFound`/`redirect`.
 *
 * `renderRoot` navigates via `req.server.*` in two places:
 * - during orchestration (e.g. the unauthenticated login redirect) — the throw
 *   propagates out of `renderRoot` and is caught by the loader's try/catch;
 * - deep inside streamed view components (e.g. `DocumentView` access checks,
 *   `LoginView` already-authenticated) — here the throw happens during
 *   `renderServerComponent` and is swallowed into the RSC stream, so it never
 *   rejects the render promise.
 *
 * Recording the intent on `nav` lets the loader honor the second case by
 * inspecting `nav` after the render resolves, then re-throwing native TanStack
 * nav at the loader boundary.
 */
export const createPageRenderServerAdapter = (nav: PageNavIntent): ServerAdapter => ({
  ...tanstackServerAdapter,
  notFound: () => {
    nav.type = 'notFound'
    throw new Error('not-found')
  },
  permanentRedirect: (path: string) => {
    nav.type = 'redirect'
    nav.url = path
    throw new Error(`redirect:${path}`)
  },
  redirect: (path: string) => {
    nav.type = 'redirect'
    nav.url = path
    throw new Error(`redirect:${path}`)
  },
})

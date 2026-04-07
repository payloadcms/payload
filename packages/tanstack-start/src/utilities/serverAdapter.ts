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

  setCookie: (name: string, value: string, options?: CookieOptions) => {
    setResponseHeader('Set-Cookie', serializeCookie(name, value, options))
  },
}

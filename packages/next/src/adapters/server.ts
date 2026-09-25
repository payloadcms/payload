import type { CookieStore, ServerAdapter } from 'payload'

import { cookies as getNextCookies, headers as getNextHeaders } from 'next/headers.js'
import {
  forbidden as nextForbidden,
  notFound as nextNotFound,
  permanentRedirect as nextPermanentRedirect,
  redirect as nextRedirect,
  unauthorized as nextUnauthorized,
} from 'next/navigation.js'

const toCookieStore = async (): Promise<CookieStore> => {
  const store = await getNextCookies()

  return {
    get: (name) => {
      const cookie = store.get(name)
      return cookie ? { name: cookie.name, value: cookie.value } : undefined
    },
    getAll: () => store.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value })),
    set: (name, value, options) => {
      store.set(name, value, options)
    },
  }
}

/**
 * Adapts Next.js server-side APIs to the framework-agnostic `ServerAdapter` interface.
 * This way we can invoke these methods within our server components and plugins without importing Next.js modules directly.
 */
export const nextServerAdapter: ServerAdapter = {
  forbidden: () => nextForbidden(),
  getCookies: toCookieStore,
  getHeaders: () => getNextHeaders(),
  notFound: () => nextNotFound(),
  permanentRedirect: (path) => nextPermanentRedirect(path),
  redirect: (path) => nextRedirect(path),
  setCookie: async (name, value, options) => {
    const store = await getNextCookies()
    store.set(name, value, options)
  },
  unauthorized: () => nextUnauthorized(),
}

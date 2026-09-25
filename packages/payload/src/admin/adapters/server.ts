import type { CookieOptions, CookieStore } from './cookies.js'

/**
 * Server-side adapter passed into server functions (not React context).
 * Abstracts framework-specific server APIs like cookies, headers, redirect.
 */
export type ServerAdapter = {
  /**
   * Throws a Next-style "forbidden" boundary (HTTP 403 semantics). Plugins
   * should treat this as a control-flow `never` — execution does not return.
   */
  forbidden: () => never
  getCookies: () => CookieStore | Promise<CookieStore>
  getHeaders: () => Headers | Promise<Headers>
  notFound: () => never
  permanentRedirect: (path: string) => never
  redirect: (path: string) => never
  setCookie: (name: string, value: string, options?: CookieOptions) => Promise<void> | void
  /**
   * Throws a Next-style "unauthorized" boundary (HTTP 401 semantics).
   */
  unauthorized: () => never
}

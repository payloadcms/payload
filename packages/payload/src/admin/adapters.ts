import type React from 'react'

/**
 * Client-side router adapter to abstract away framework-specific routing implementations.
 * This way plugins and server components can use server-only APIs without directly importing any framework-specific modules.
 *
 * @example
 * ```tsx
 * // Next.js router adapter (simplified):
 * import { useRouter as useNextRouter, usePathname as useNextPathname } from 'next/navigation'
 *
 * const NextRouterAdapter: RouterAdapterComponent = ({ children }) => {
 *   const router = useNextRouter()
 *   const pathname = useNextPathname()
 *
 *   return (
 *     <RouterAdapterContext value={{ router, pathname, ... }}>
 *       {children}
 *     </RouterAdapterContext>
 *   )
 * }
 * ```
 */
export type RouterAdapterComponent = React.ComponentType<{ children: React.ReactNode }>

export type RouterAdapterRouter = {
  /**
   * Navigate back to the previous page in the history stack.
   */
  back: () => void
  /**
   * Navigate to a new path.
   */
  push: (path: string, options?: { scroll?: boolean }) => void
  /**
   * Refresh the current route.
   */
  refresh: () => void
  /**
   * Replace the current path with a new one.
   */
  replace: (path: string, options?: { scroll?: boolean }) => void
}

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

export type CookieStore = {
  get: (name: string) => { name: string; value: string } | null | undefined
  getAll?: () => Array<{ name: string; value: string }>
  set?: (name: string, value: string, options?: CookieOptions) => void
}

export type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: 'lax' | 'none' | 'strict'
  secure?: boolean
}

export type LinkAdapterProps = {
  children?: React.ReactNode
  href: string
  prefetch?: boolean
  ref?: React.Ref<HTMLAnchorElement>
  replace?: boolean
  scroll?: boolean
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

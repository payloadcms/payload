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

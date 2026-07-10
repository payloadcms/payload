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
  /**
   * Use this property to standardize behaviors across different router implementations.
   *
   * It allows the browser URL to reflect client state WITHOUT triggering a router navigation event.
   * This is useful in scenarios where you want to update the URL to reflect client state (e.g. query params)
   * without causing a full page reload or re-running route loaders.
   *
   * In Next.js, calling `window.history.replaceState` directly is sufficient, as Next.js does not observe history mutations.
   * In TanStack Router, they've monkeypatched `history.replaceState` to notify the router of changes.
   */
  replaceState?: (url: string) => void
}

export type LinkAdapterProps = {
  children?: React.ReactNode
  href: string
  prefetch?: boolean
  ref?: React.Ref<HTMLAnchorElement>
  replace?: boolean
  scroll?: boolean
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

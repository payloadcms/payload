'use client'
/**
 * TanStack Start RouterProvider — scaffold.
 *
 * Replace the stub hooks below with real @tanstack/react-router imports:
 *   import { Link, useLocation, useParams, useRouter } from '@tanstack/react-router'
 */

import type {
  RouterProvider as BaseRouterProvider,
  type LinkProps,
  RouterContextType,
} from '@payloadcms/ui'

import React from 'react'

// ─── Replace with real @tanstack/react-router imports ─────────────────────
type RouterStub = {
  history: { back(): void; forward(): void }
  invalidate(): void
  navigate(o: { replace?: boolean; to: string }): void
  preloadRoute(o: { to: string }): void
}
type LocationStub = { pathname: string; search: string }
function useTanStackRouter(): RouterStub {
  throw new Error('Not implemented — swap in @tanstack/react-router')
}
function useTanStackLocation(): LocationStub {
  throw new Error('Not implemented — swap in @tanstack/react-router')
}
function useTanStackParams(): Record<string, string | string[]> {
  throw new Error('Not implemented — swap in @tanstack/react-router')
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TanStackLink: React.FC<{ [key: string]: any; to: string }> = () => null
// ──────────────────────────────────────────────────────────────────────────

const AdapterLink: React.FC<LinkProps> = ({ children, href, ...rest }) => (
  <TanStackLink to={href} {...rest}>
    {children}
  </TanStackLink>
)

export function TanStackRouterProvider({ children }: { children: React.ReactNode }) {
  const router = useTanStackRouter()
  const location = useTanStackLocation()
  const params = useTanStackParams()
  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location])

  const routerCtx: RouterContextType = React.useMemo(
    () => ({
      Link: AdapterLink,
      params,
      pathname: location.pathname,
      router: {
        back: () => router.history.back(),
        forward: () => router.history.forward(),
        prefetch: (url: string) => router.preloadRoute({ to: url }),
        push: (url: string) => router.navigate({ to: url }),
        refresh: () => router.invalidate(),
        replace: (url: string) => router.navigate({ replace: true, to: url }),
      },
      searchParams,
    }),
    [router, location, params, searchParams],
  )

  return <BaseRouterProvider router={routerCtx}>{children}</BaseRouterProvider>
}

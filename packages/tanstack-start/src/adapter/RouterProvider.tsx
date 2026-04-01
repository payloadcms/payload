'use client'
import type { RouterContextType, LinkProps as RouterLinkProps } from '@payloadcms/ui'

import { RouterProvider as BaseRouterProvider } from '@payloadcms/ui'
import { Link as TanStackLink, useLocation, useParams, useRouter } from '@tanstack/react-router'
import React from 'react'

const AdapterLink: React.FC<RouterLinkProps> = ({ children, href, ...rest }) => (
  <TanStackLink to={href} {...(rest as object)}>
    {children}
  </TanStackLink>
)

export function TanStackRouterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const location = useLocation()
  const params = useParams({ strict: false })

  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search])

  const routerCtx: RouterContextType = React.useMemo(
    () => ({
      Link: AdapterLink,
      params,
      pathname: location.pathname,
      router: {
        back: () => router.history.back(),
        forward: () => router.history.forward(),
        prefetch: (url: string) => router.preloadRoute({ to: url }),
        push: (url: string) => {
          void router.navigate({ to: url })
        },
        refresh: () => {
          void router.invalidate()
        },
        replace: (url: string) => {
          void router.navigate({ replace: true, to: url })
        },
      },
      searchParams,
    }),
    [router, location, params, searchParams],
  )

  return <BaseRouterProvider router={routerCtx}>{children}</BaseRouterProvider>
}

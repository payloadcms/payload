'use client'

import type { RouterAdapterContextValue } from '@payloadcms/ui'
import type { LinkAdapterProps, RouterAdapterComponent } from 'payload'

import { RouterAdapterContext } from '@payloadcms/ui'
import { Link as TanStackLink, useLocation, useParams, useRouter } from '@tanstack/react-router'
import React from 'react'

const TanStackLinkAdapter: React.FC<LinkAdapterProps> = ({
  children,
  href,
  prefetch,
  ref,
  replace,
  scroll,
  ...rest
}) => {
  return (
    <TanStackLink
      preload={prefetch === false ? false : 'intent'}
      ref={ref}
      replace={replace}
      resetScroll={scroll}
      to={href}
      {...rest}
    >
      {children}
    </TanStackLink>
  )
}

export const TanStackRouterAdapter: RouterAdapterComponent = ({ children }) => {
  const router = useRouter()
  const location = useLocation()
  const params = useParams({ strict: false })

  const value: RouterAdapterContextValue = {
    Link: TanStackLinkAdapter,
    params: params as Record<string, string | string[]>,
    pathname: location.pathname,
    router: {
      back: () => router.history.back(),
      push: (path: string, options?: { scroll?: boolean }) => {
        void router.navigate({ resetScroll: options?.scroll, to: path })
      },
      refresh: () => {
        void router.invalidate()
      },
      replace: (path: string, options?: { scroll?: boolean }) => {
        void router.navigate({ replace: true, resetScroll: options?.scroll, to: path })
      },
    },
    searchParams: new URLSearchParams(location.search),
  }

  return <RouterAdapterContext value={value}>{children}</RouterAdapterContext>
}

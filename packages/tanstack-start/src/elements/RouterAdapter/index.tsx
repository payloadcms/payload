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

  const adaptedParams: Record<string, string | string[]> = { ...params }

  if ('_splat' in params && typeof params._splat === 'string') {
    adaptedParams.segments = params._splat.split('/').filter(Boolean)
  }

  const value: RouterAdapterContextValue = {
    Link: TanStackLinkAdapter,
    params: adaptedParams,
    pathname: location.pathname,
    router: {
      back: () => router.history.back(),
      push: (path: string, options?: { scroll?: boolean }) => {
        // TanStack Router's navigate expects relative paths, not absolute URLs.
        // usePreventLeave stores anchor.href (absolute URL), so strip the origin.
        const relativePath = path.startsWith('http')
          ? new URL(path).pathname + new URL(path).search
          : path
        void router.navigate({ resetScroll: options?.scroll, to: relativePath })
      },
      refresh: () => {
        void router.invalidate()
      },
      replace: (path: string, options?: { scroll?: boolean }) => {
        const relativePath = path.startsWith('http')
          ? new URL(path).pathname + new URL(path).search
          : path
        void router.navigate({ replace: true, resetScroll: options?.scroll, to: relativePath })
      },
    },
    searchParams: new URLSearchParams(location.search),
  }

  return <RouterAdapterContext value={value}>{children}</RouterAdapterContext>
}

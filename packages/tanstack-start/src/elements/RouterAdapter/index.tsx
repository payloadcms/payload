'use client'

import type { RouterAdapterContextValue } from '@payloadcms/ui'
import type { LinkAdapterProps, RouterAdapterComponent } from 'payload'

import { RouterAdapterContext } from '@payloadcms/ui'
import { Link as TanStackLink, useLocation, useParams, useRouter } from '@tanstack/react-router'
import React, { useCallback, useMemo } from 'react'

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

  const adaptedParams = useMemo(() => {
    const adapted: Record<string, string | string[]> = { ...params }
    if ('_splat' in params && typeof params._splat === 'string') {
      adapted.segments = params._splat.split('/').filter(Boolean)
    }
    return adapted
  }, [params])

  const back = useCallback(() => router.history.back(), [router])
  const push = useCallback(
    (path: string, options?: { scroll?: boolean }) => {
      const relativePath = path.startsWith('http')
        ? new URL(path).pathname + new URL(path).search
        : path
      void router.navigate({ resetScroll: options?.scroll, to: relativePath })
    },
    [router],
  )
  const refresh = useCallback(() => {
    void router.invalidate()
  }, [router])
  const replace = useCallback(
    (path: string, options?: { scroll?: boolean }) => {
      const relativePath = path.startsWith('http')
        ? new URL(path).pathname + new URL(path).search
        : path
      void router.navigate({ replace: true, resetScroll: options?.scroll, to: relativePath })
    },
    [router],
  )

  const adaptedRouter = useMemo(
    () => ({ back, push, refresh, replace }),
    [back, push, refresh, replace],
  )

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const value: RouterAdapterContextValue = useMemo(
    () => ({
      Link: TanStackLinkAdapter,
      params: adaptedParams,
      pathname: location.pathname,
      router: adaptedRouter,
      searchParams,
    }),
    [adaptedParams, location.pathname, adaptedRouter, searchParams],
  )

  return <RouterAdapterContext value={value}>{children}</RouterAdapterContext>
}

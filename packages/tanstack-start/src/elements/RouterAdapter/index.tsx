'use client'

import type { RouterAdapterContextValue } from '@payloadcms/ui'
import type { LinkAdapterProps, RouterAdapterComponent } from 'payload'

import { RouterAdapterContext } from '@payloadcms/ui'
import { Link as TanStackLink, useLocation, useParams, useRouter } from '@tanstack/react-router'
import React, { useCallback, useMemo } from 'react'

const normalizeNavigationTarget = ({
  path,
  pathname,
  search,
}: {
  path: string
  pathname: string
  search: string
}) => {
  if (path.startsWith('http')) {
    const url = new URL(path)
    return `${url.pathname}${url.search}${url.hash}`
  }

  if (path.startsWith('?')) {
    return `${pathname}${path}`
  }

  if (path.startsWith('#')) {
    return `${pathname}${search}${path}`
  }

  return path
}

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
      const relativePath = normalizeNavigationTarget({
        path,
        pathname: window.location.pathname,
        search: window.location.search,
      })
      void router.navigate({ resetScroll: options?.scroll, to: relativePath })
    },
    [router],
  )
  const refresh = useCallback(() => {
    void router.invalidate()
  }, [router])
  const replace = useCallback(
    (path: string, options?: { scroll?: boolean }) => {
      const relativePath = normalizeNavigationTarget({
        path,
        pathname: window.location.pathname,
        search: window.location.search,
      })
      void router.navigate({ replace: true, resetScroll: options?.scroll, to: relativePath })
    },
    [router],
  )

  const adaptedRouter = useMemo(
    () => ({ back, push, refresh, replace }),
    [back, push, refresh, replace],
  )

  // `location.searchStr` is the serialized query string; `location.search` is
  // the parsed object (a nested structure once the router uses `qs` for search
  // serialization), which `URLSearchParams` cannot consume. Build from the
  // string so Payload's `parseSearchParams` re-parses the bracket notation.
  const searchParams = useMemo(() => new URLSearchParams(location.searchStr), [location.searchStr])

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

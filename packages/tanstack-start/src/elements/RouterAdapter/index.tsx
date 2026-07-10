'use client'

import type { RouterAdapterContextValue } from '@payloadcms/ui'
import type { LinkAdapterProps, RouterAdapterComponent } from 'payload'

import { RouterAdapterContext } from '@payloadcms/ui'
import { Link as TanStackLink, useLocation, useParams, useRouter } from '@tanstack/react-router'
import * as qs from 'qs-esm'
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

  // Split a target into `to` (pathname) + a parsed `search` object, so the
  // router serializes the query via its `stringifySearch` (qs, bracket-encoded)
  // rather than embedding the raw string in `to`. Navigating with a string `to`
  // leaves the search *unencoded* in `window.location.search`
  // (e.g. `where[or][0]…`), which then never matches Payload's `qs.stringify`
  // output (`where%5Bor%5D…`) — breaking the list-view `syncPropsToURL` guard,
  // which compares the two and would otherwise clobber optimistic query state
  // (e.g. an in-progress filter condition) on every navigation.
  const toNavOptions = useCallback((path: string) => {
    const relativePath = normalizeNavigationTarget({
      path,
      pathname: window.location.pathname,
      search: window.location.search,
    })
    const queryIndex = relativePath.indexOf('?')
    if (queryIndex === -1) {
      return { to: relativePath }
    }
    const searchObject = qs.parse(relativePath.slice(queryIndex + 1), {
      depth: 10,
      ignoreQueryPrefix: true,
    })
    // Function form replaces the search entirely (no merge with current search).
    return { search: () => searchObject, to: relativePath.slice(0, queryIndex) }
  }, [])

  const back = useCallback(() => router.history.back(), [router])
  const push = useCallback(
    (path: string, options?: { scroll?: boolean }) => {
      void router.navigate({ ...toNavOptions(path), resetScroll: options?.scroll })
    },
    [router, toNavOptions],
  )
  const refresh = useCallback(() => {
    void router.invalidate()
  }, [router])
  const replace = useCallback(
    (path: string, options?: { scroll?: boolean }) => {
      void router.navigate({ ...toNavOptions(path), replace: true, resetScroll: options?.scroll })
    },
    [router, toNavOptions],
  )

  // Sync client state (e.g. server-resolved query defaults) to the URL without
  // re-running the route loader. TanStack's browser history monkeypatches
  // `window.history.replaceState` and notifies `router.load` on every call, so a
  // raw `replaceState` would change `loaderDeps` and trigger a redundant second
  // server load. `_ignoreSubscribers` suppresses that notification — the same
  // flag TanStack uses internally when flushing history.
  const replaceState = useCallback(
    (url: string) => {
      const { history } = router
      history._ignoreSubscribers = true
      try {
        window.history.replaceState(null, '', url)
      } finally {
        history._ignoreSubscribers = false
      }
    },
    [router],
  )

  const adaptedRouter = useMemo(
    () => ({ back, push, refresh, replace, replaceState }),
    [back, push, refresh, replace, replaceState],
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

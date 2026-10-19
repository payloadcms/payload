'use client'

import type { RouterAdapterContextValue } from '@payloadcms/ui'
import type { LinkAdapterProps } from 'payload'

import { RouterAdapterContext, useRouteTransition } from '@payloadcms/ui'
import React, { createContext, use, useEffect, useMemo, useSyncExternalStore } from 'react'

import {
  getPendingCount,
  getReplacedURL,
  navigate,
  refresh,
  replaceState,
  subscribe,
} from './navigationStore.js'

type Location = { adminRoute: string; url: string }

const LocationContext = createContext<Location>({ adminRoute: '', url: '/' })

/**
 * Wraps the whole admin document. The server renders it with the request URL, so the URL Payload's
 * hooks see always arrives in the same RSC payload as the tree that was rendered for it.
 */
export function LocationProvider({
  adminRoute,
  children,
  url,
}: { children: React.ReactNode } & Location) {
  const replacedURL = useSyncExternalStore(subscribe, getReplacedURL, () => undefined)

  return (
    <LocationContext value={{ adminRoute, url: replacedURL ?? url }}>{children}</LocationContext>
  )
}

const Link: React.FC<LinkAdapterProps> = ({
  children,
  href,
  onClick,
  prefetch: _prefetch,
  ref,
  replace,
  scroll,
  ...rest
}) => (
  <a
    {...rest}
    href={href}
    onClick={(event) => {
      onClick?.(event)
      const isModified =
        event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      if (event.defaultPrevented || isModified || (rest.target && rest.target !== '_self')) {
        return
      }
      event.preventDefault()
      void navigate(href, { history: replace ? 'replace' : 'push', scroll })
    }}
    ref={ref}
  >
    {children}
  </a>
)

const router: RouterAdapterContextValue['router'] = {
  back: () => window.history.back(),
  push: (path, options) => void navigate(path, { history: 'push', scroll: options?.scroll }),
  refresh: () => void refresh(),
  replace: (path, options) => void navigate(path, { history: 'replace', scroll: options?.scroll }),
  replaceState,
}

/** Payload's router contract, implemented with RSC fetches instead of a framework router. */
export const RouterAdapter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminRoute, url } = use(LocationContext)
  const isNavigating = useSyncExternalStore(
    subscribe,
    () => getPendingCount() > 0,
    () => false,
  )
  const { holdRouteTransition } = useRouteTransition()

  useEffect(
    () => (isNavigating ? holdRouteTransition() : undefined),
    [holdRouteTransition, isNavigating],
  )

  const value = useMemo<RouterAdapterContextValue>(() => {
    const { pathname, searchParams } = new URL(url, 'http://localhost')
    const segments = pathname
      .slice(adminRoute.length)
      .split('/')
      .filter(Boolean)
      .map(decodeURIComponent)
    const params: Record<string, string[]> = segments.length > 0 ? { segments } : {}

    return { Link, params, pathname, router, searchParams }
  }, [adminRoute, url])

  return <RouterAdapterContext value={value}>{children}</RouterAdapterContext>
}

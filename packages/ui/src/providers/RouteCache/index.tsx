'use client'

import { usePathname, useRouter } from 'next/navigation.js'
import React, { createContext, use, useCallback, useEffect, useRef } from 'react'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'

export type RouteCacheContext = {
  cachingEnabled: boolean
  clearRouteCache: () => void
}

const Context = createContext<RouteCacheContext>({
  cachingEnabled: true,
  clearRouteCache: () => {},
})

export const RouteCache: React.FC<{ cachingEnabled?: boolean; children: React.ReactNode }> = ({
  cachingEnabled = true,
  children,
}) => {
  const pathname = usePathname()
  const router = useRouter()

  /**
   * Next.js caches pages in memory in their {@link https://nextjs.org/docs/app/guides/caching#client-side-router-cache Client-side Router Cache},
   * causing forward/back browser navigation to show stale data from a previous visit.
   * The problem is this bfcache-like behavior has no opt-out, even if the page is dynamic, requires authentication, etc.
   * The workaround is to force a refresh when navigating via the browser controls.
   * This should be removed if/when Next.js supports this natively.
   */
  const clearAfterPathnameChange = useRef(false)

  const clearRouteCache = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    const handlePopState = () => {
      clearAfterPathnameChange.current = true
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router])

  const handlePathnameChange = useEffectEvent((pathname: string) => {
    if (cachingEnabled || clearAfterPathnameChange.current) {
      clearAfterPathnameChange.current = false
      clearRouteCache()
    }
  })

  useEffect(() => {
    handlePathnameChange(pathname)
  }, [pathname])

  return <Context value={{ cachingEnabled, clearRouteCache }}>{children}</Context>
}

export const useRouteCache = () => use(Context)

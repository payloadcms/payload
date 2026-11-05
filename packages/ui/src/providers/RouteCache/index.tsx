'use client'

import React, { createContext, use, useCallback, useEffect, useRef } from 'react'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { usePathname, useRouter } from '../RouterAdapter/index.js'

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
  const previousPathnameRef = useRef('')

  const clearRouteCache = useCallback(() => {
    router.refresh()
  }, [router])

  /**
   * Next.js caches pages in memory in their {@link https://nextjs.org/docs/app/guides/caching#client-side-router-cache Client-side Router Cache},
   * causing forward/back browser navigation to show stale data from a previous visit.
   * The problem is this bfcache-like behavior has no opt-out, even if the page is dynamic, requires authentication, etc.
   * The workaround is to force a refresh when navigating via the browser controls.
   * This should be removed if/when Next.js supports this natively.
   */
  useEffect(() => {
    if (cachingEnabled) {
      // Already refreshed on every pathname change below
      return
    }

    previousPathnameRef.current = window.location.pathname

    let refreshTimeout: ReturnType<typeof setTimeout> | undefined

    const handlePopState = () => {
      const currentPathname = window.location.pathname

      // Fragment navigation also fires popstate. Refreshing the same route resets unsaved forms.
      if (previousPathnameRef.current === currentPathname) {
        return
      }

      previousPathnameRef.current = currentPathname

      // Next.js restores the previous page in its own `popstate` listener. With `cacheComponents`,
      // that happens synchronously and may run before or after this listener, so refreshing right
      // away (or in a microtask) could refresh the page we are leaving. A timeout runs after all
      // `popstate` listeners, once the restored page is the current route.
      refreshTimeout = setTimeout(clearRouteCache, 0)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      clearTimeout(refreshTimeout)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [cachingEnabled, clearRouteCache])

  const handlePathnameChange = useEffectEvent(() => {
    if (cachingEnabled) {
      clearRouteCache()
    }
  })

  useEffect(() => {
    handlePathnameChange()

    const currentPathname = window.location.pathname

    // Next.js may commit the restored route before popstate runs. Keep the previous path until then.
    const timeout = setTimeout(() => {
      previousPathnameRef.current = currentPathname
    }, 0)

    return () => clearTimeout(timeout)
  }, [pathname])

  return <Context value={{ cachingEnabled, clearRouteCache }}>{children}</Context>
}

export const useRouteCache = () => use(Context)

'use client'

import { usePathname, useRouter } from 'next/navigation.js'
import React, { createContext, use, useCallback, useEffect, useRef } from 'react'

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
  const clearAfterPathnameChange = useRef(false)

  const clearRouteCache = useCallback(() => {
    console.log('CLEARNING~')
    router.refresh()
  }, [router])

  useEffect(() => {
    const handlePopState = () => {
      // Calling `router.refresh()` directly here doesn't work. Probably fires too early.
      // Instead, need to set a flag that we can check on the next pathname change.
      clearAfterPathnameChange.current = true
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router])

  useEffect(() => {
    if (cachingEnabled || clearAfterPathnameChange.current) {
      clearAfterPathnameChange.current = false
      clearRouteCache()
    }
  }, [pathname, clearRouteCache, cachingEnabled])

  return <Context value={{ cachingEnabled, clearRouteCache }}>{children}</Context>
}

export const useRouteCache = () => use(Context)

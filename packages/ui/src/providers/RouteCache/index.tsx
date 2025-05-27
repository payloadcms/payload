'use client'

import { usePathname, useRouter } from 'next/navigation.js'
import React, { createContext, use, useCallback, useEffect } from 'react'

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

  const clearRouteCache = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    if (cachingEnabled) {
      clearRouteCache()
    }
  }, [pathname, clearRouteCache, cachingEnabled])

  return <Context value={{ cachingEnabled, clearRouteCache }}>{children}</Context>
}

export const useRouteCache = () => use(Context)

'use client'

import { usePathname, useRouter } from 'next/navigation.js'
import React, { createContext, use, useCallback, useEffect } from 'react'

export type RouteCacheContext = {
  clearRouteCache: () => void
}

const Context = createContext<RouteCacheContext>({
  clearRouteCache: () => {},
})

export const RouteCache: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()

  const clearRouteCache = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    clearRouteCache()
  }, [pathname, clearRouteCache])

  return <Context value={{ clearRouteCache }}>{children}</Context>
}

export const useRouteCache = () => use(Context)

'use client'

import { usePathname, useRouter } from 'next/navigation.js'
import React, { createContext, useCallback, useContext, useEffect } from 'react'

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

  return <Context.Provider value={{ clearRouteCache }}>{children}</Context.Provider>
}

export const useRouteCache = () => useContext(Context)

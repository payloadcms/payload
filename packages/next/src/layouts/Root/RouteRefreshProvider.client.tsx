'use client'
import { usePathname, useRouter } from 'next/navigation.js'
import React, { useEffect, useRef } from 'react'

/**
 * Centralized route refresh provider that calls `router.refresh()`
 * when navigating to specific views to prevent stale data issues with browser back/forward navigation
 * due to the Next.js client side caching similar to BF-cache, see:
 * https://nextjs.org/docs/app/guides/caching#client-side-router-cache
 */
export const RouteRefreshProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const prevPathnameRef = useRef<string>()

  useEffect(() => {
    const prevPathname = prevPathnameRef.current
    prevPathnameRef.current = pathname

    // Check if we're navigating to routes that need refresh
    const needsRefresh =
      // Document edit routes: /collections/{slug}/{id} or /globals/{slug}
      /^\/admin\/collections\/[^/]+\/[^/]+(?:\/[^/]*)?$/.test(pathname) ||
      /^\/admin\/globals\/[^/]+(?:\/[^/]*)?$/.test(pathname) ||
      // Versions routes: /collections/{slug}/{id}/versions or /globals/{slug}/versions
      pathname.includes('/versions') ||
      // List routes: /collections/{slug}
      /^\/admin\/collections\/[^/]+\/?$/.test(pathname)

    if (needsRefresh && prevPathname && prevPathname !== pathname) {
      router.refresh()
    }
  }, [pathname, router])

  return <>{children}</>
}

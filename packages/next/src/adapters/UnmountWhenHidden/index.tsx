'use client'
import type React from 'react'

import { useLayoutEffect, useState } from 'react'

/**
 * With `cacheComponents`, Next.js does not unmount pages you navigate away from. It keeps the last
 * few inside a hidden React `<Activity>` boundary so going back can restore them. In the admin
 * panel, that leaves hidden copies of previous views in the DOM (duplicate element IDs, old client
 * state) and breaks selectors that expect a single match.
 *
 * React runs effect cleanups when an `<Activity>` boundary is hidden. This component uses that to
 * render nothing while hidden, so the view is mounted fresh when it becomes visible again, like it
 * is without `cacheComponents`. Without `cacheComponents` this component does nothing.
 *
 * @see https://github.com/vercel/next.js/issues/86577
 * @see https://react.dev/reference/react/Activity
 */
export const UnmountWhenHidden: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useLayoutEffect(() => {
    setIsVisible(true)

    return () => setIsVisible(false)
  }, [])

  return isVisible ? children : null
}

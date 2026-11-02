'use client'
import { useRouter } from 'next/navigation.js'
import React, { useLayoutEffect, useState } from 'react'

/**
 * With `cacheComponents`, Next.js does not unmount pages you navigate away from. It keeps the last
 * few inside a hidden React `<Activity>` boundary so going back can restore them. In the admin
 * panel, that leaves hidden copies of previous views in the DOM (duplicate element IDs, old client
 * state) and breaks selectors that expect a single match.
 *
 * React runs effect cleanups when an `<Activity>` boundary is hidden. This component uses that to
 * render nothing while hidden, so the view is mounted fresh when it becomes visible again, like it
 * is without `cacheComponents`. Only rendered when `cacheComponents` is enabled.
 *
 * @see https://github.com/vercel/next.js/issues/86577
 * @see https://react.dev/reference/react/Activity
 */
export const UnmountWhenHidden: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  // Next.js shows the hidden copy again when you navigate to a view you visited recently. That copy
  // is empty, so it would show a blank page until the view rendered again. `bfcacheId` changes on
  // those navigations, so the new key mounts the view as part of the navigation instead.
  // https://nextjs.org/docs/app/api-reference/functions/use-router#bfcacheid
  const { bfcacheId } = useRouter()

  return <RenderNothingWhileHidden key={bfcacheId}>{children}</RenderNothingWhileHidden>
}

const RenderNothingWhileHidden: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useLayoutEffect(() => {
    setIsVisible(true)

    return () => setIsVisible(false)
  }, [])

  return isVisible ? children : null
}

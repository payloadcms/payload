'use client'

import { useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

/**
 * Publishes admin-route readiness on `window.__TANSTACK_HYDRATED__`, which the Playwright
 * `goto`/`reload` wrapper installed by `initPageConsoleErrorCatch` waits for.
 *
 * Shell hydration is not a sufficient signal. `AdminPage` renders an RSC payload fetched by
 * the route loader, so on a full document load the SSR'd view is torn down ~30ms in and
 * re-mounted ~300ms later as different DOM nodes. An interaction landing in that window is
 * lost outright — the element it targeted no longer exists — and unlike Next.js there is no
 * dehydrated boundary for React to replay the event into.
 *
 * `status === 'idle'` with no in-flight load means loaders resolved and matches committed,
 * i.e. the payload is mounted and owned by React. Tracking router state rather than latching
 * on first mount also keeps the flag honest across subsequent navigations.
 *
 * Production users never see this marker; tests opt in via the Playwright wrapper and read
 * the global directly.
 */
export function HydrationMarker() {
  // `select` must return a primitive. `useRouterState` re-renders on every reference
  // change, so returning an object here loops.
  const isReady = useRouterState({
    select: (state) => state.status === 'idle' && !state.isLoading && !state.isTransitioning,
  })

  useEffect(() => {
    ;(window as unknown as { __TANSTACK_HYDRATED__?: boolean }).__TANSTACK_HYDRATED__ = isReady
  }, [isReady])

  return null
}

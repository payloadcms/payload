import { useEffect } from 'react'

/**
 * Sets `window.__TANSTACK_HYDRATED__ = true` after the first effect runs,
 * which is the earliest point at which React's event handlers are guaranteed
 * to be attached. The Playwright `goto` wrapper in `initPageConsoleErrorCatch`
 * waits for this flag before returning, which prevents the very common race
 * where a Playwright click lands on the SSR'd DOM before React finishes
 * hydrating (the click focuses the button but the React `onClick` handler
 * never fires).
 *
 * Production users do not see this marker because the bundle hash differs;
 * tests opt-in via the Playwright wrapper and consult the global directly.
 */
export function HydrationMarker() {
  useEffect(() => {
    ;(window as unknown as { __TANSTACK_HYDRATED__?: boolean }).__TANSTACK_HYDRATED__ = true
  }, [])
  return null
}

'use client'
import React, { useEffect, useRef } from 'react'

import { useRouteTransition } from '../index.js'
import './index.css'

const transitionDuration = 200
const baseClass = 'progress-bar'
// Minimum time the bar stays on screen once a navigation starts. Guarantees a
// visible sweep even for near-instant client navigations (e.g. TanStack routing
// to already-loaded data), which would otherwise finish before the bar appeared.
const minVisibleDuration = 400
// Progress shown the moment the bar appears, so there is always something
// visible before `transitionProgress` begins advancing.
const initialProgress = 0.1

/**
 * Renders a progress bar that shows the progress of a route transition.
 * Place this at the root of your application, inside of the `RouteTransitionProvider`.
 * When a transition is triggered, the progress bar will show the progress of that transition and exit when the transition is complete.
 * @returns A progress bar that shows the progress of a route transition
 * @example
 * import { RouteTransitionProvider, ProgressBar, Link } from '@payloadcms/ui'
 * const App = () => (
 * <RouteTransitionProvider>
 *  <ProgressBar />
 *  <Link href="/somewhere">Go Somewhere</Link>
 * </RouteTransitionProvider>
 */
export const ProgressBar = () => {
  const { isTransitioning, transitionProgress } = useRouteTransition()
  const [progressToShow, setProgressToShow] = React.useState<null | number>(null)
  const shownAtRef = useRef<null | number>(null)

  useEffect(() => {
    let completeTimerID: NodeJS.Timeout
    let hideTimerID: NodeJS.Timeout

    if (isTransitioning) {
      // Show the bar immediately and remember when, so we can keep it on screen
      // for at least `minVisibleDuration` no matter how fast the navigation is.
      if (shownAtRef.current === null) {
        shownAtRef.current = performance.now()
      }

      setProgressToShow(Math.max(transitionProgress, initialProgress))
    } else if (shownAtRef.current !== null) {
      // A navigation just finished (the guard skips the initial mount, where no
      // navigation was ever in progress). Keep the bar visible for the rest of
      // `minVisibleDuration`, then fast-forward to 100% and fade out.
      const elapsed = performance.now() - shownAtRef.current
      const remaining = Math.max(0, minVisibleDuration - elapsed)

      shownAtRef.current = null

      // Force a visible value here, at normal priority. For fast client
      // navigations (e.g. TanStack routing that settles in a single round-trip)
      // the growing render above — driven by the optimistic `isTransitioning`
      // flag — is discarded before it paints, so the bar would otherwise only
      // flash to 100% at the tail. Setting it now guarantees the bar is on
      // screen for the whole `remaining` window before completing.
      setProgressToShow((prev) => Math.max(prev ?? 0, initialProgress))

      completeTimerID = setTimeout(() => {
        setProgressToShow(1)

        // Wait for the CSS transition to finish before hiding the progress bar.
        // This covers both the fast-forward to 100% and the subsequent fade-out.
        hideTimerID = setTimeout(() => {
          setProgressToShow(null)
        }, transitionDuration * 2)
      }, remaining)
    }

    return () => {
      clearTimeout(completeTimerID)
      clearTimeout(hideTimerID)
    }
  }, [isTransitioning, transitionProgress])

  if (typeof progressToShow === 'number') {
    return (
      <div
        className={[baseClass, progressToShow === 1 && `${baseClass}--fade-out`]
          .filter(Boolean)
          .join(' ')}
        style={{
          // @ts-expect-error - TS doesn't like custom CSS properties
          '--transition-duration': `${transitionDuration}ms`,
        }}
      >
        <div
          className={`${baseClass}__progress`}
          style={{
            width: `${(progressToShow || 0) * 100}%`,
          }}
        />
      </div>
    )
  }

  return null
}

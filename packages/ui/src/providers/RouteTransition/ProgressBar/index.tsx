'use client'
import React, { useEffect } from 'react'

import { useRouteTransition } from '../index.js'
import './index.scss'

const transitionDuration = 200
const baseClass = 'progress-bar'

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

  useEffect(() => {
    let clearTimerID: NodeJS.Timeout

    if (isTransitioning) {
      setProgressToShow(transitionProgress)
    } else {
      // Fast forward to 100% when the transition is complete
      // Then fade out the progress bar directly after
      setProgressToShow(1)

      // Wait for CSS transition to finish before hiding the progress bar
      // This includes both the fast-forward to 100% and the subsequent fade-out
      clearTimerID = setTimeout(() => {
        setProgressToShow(null)
      }, transitionDuration * 2)
    }

    return () => clearTimeout(clearTimerID)
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
}

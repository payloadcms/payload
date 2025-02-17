'use client'
import React, { useEffect, useRef } from 'react'

import { useRouteTransition } from '../index.js'
import './index.scss'

const transitionDuration = 200
const baseClass = 'progress-bar'
const initialDelay = 150

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
  const shouldDelayProgress = useRef(true)

  useEffect(() => {
    let clearTimerID: NodeJS.Timeout
    let delayTimerID: NodeJS.Timeout

    if (isTransitioning) {
      if (shouldDelayProgress.current) {
        delayTimerID = setTimeout(() => {
          setProgressToShow(transitionProgress)
          shouldDelayProgress.current = false
        }, initialDelay)
      } else {
        setProgressToShow(transitionProgress)
      }
    } else {
      shouldDelayProgress.current = true

      // Fast forward to 100% when the transition is complete
      // Then fade out the progress bar directly after
      setProgressToShow(1)

      // Wait for CSS transition to finish before hiding the progress bar
      // This includes both the fast-forward to 100% and the subsequent fade-out
      clearTimerID = setTimeout(() => {
        setProgressToShow(null)
      }, transitionDuration * 2)
    }

    return () => {
      clearTimeout(clearTimerID)
      clearTimeout(delayTimerID)
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

'use client'
import React, { useEffect, useRef } from 'react'

import { useRouteTransition } from '../index.js'
import './index.css'

const transitionDuration = 200
const baseClass = 'progress-bar'
const initialDelay = 200
const completionAnimationThreshold = 1000

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
  const transitionStartedAt = useRef<null | number>(null)
  const completionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(completionTimer.current), [])

  useEffect(() => {
    let delayTimerID: NodeJS.Timeout

    if (isTransitioning) {
      clearTimeout(completionTimer.current)
      transitionStartedAt.current ??= Date.now()

      if (shouldDelayProgress.current) {
        delayTimerID = setTimeout(() => {
          setProgressToShow(transitionProgress)
          shouldDelayProgress.current = false
        }, initialDelay)
      } else {
        setProgressToShow(transitionProgress)
      }
    } else if (transitionStartedAt.current !== null) {
      shouldDelayProgress.current = true

      const shouldAnimateCompletion =
        Date.now() - transitionStartedAt.current >= completionAnimationThreshold

      transitionStartedAt.current = null

      if (shouldAnimateCompletion) {
        setProgressToShow((currentProgress) => (currentProgress === null ? null : 1))

        // Allow both the width transition and the subsequent fade-out to finish.
        completionTimer.current = setTimeout(() => {
          setProgressToShow(null)
        }, transitionDuration * 2)
      } else {
        setProgressToShow(null)
      }
    }

    return () => {
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

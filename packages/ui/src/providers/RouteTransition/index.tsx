'use client'
import React, { startTransition, useCallback, useEffect, useOptimistic, useRef } from 'react'

export const RouteTransitionProvider: React.FC<RouteTransitionProps> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useOptimistic(false)
  const [transitionProgress, setTransitionProgress] = React.useState<number>(0)

  const transitionProgressRef = useRef(transitionProgress)

  const timerID = useRef(null)

  const initiateProgress = useCallback(() => {
    // randomly update progress at random times, never reaching 100%
    timerID.current = setInterval(() => {
      const projectedProgress =
        transitionProgressRef.current + Math.random() * 0.1 * (1 - transitionProgressRef.current)

      const newProgress = projectedProgress >= 1 ? 1 : projectedProgress

      setTransitionProgress(newProgress)
      transitionProgressRef.current = newProgress
    }, 250) // every n ms, update progress
  }, [])

  useEffect(() => {
    setTransitionProgress(0)
    transitionProgressRef.current = 0

    if (isTransitioning) {
      initiateProgress()
    } else {
      if (timerID.current) {
        clearInterval(timerID.current)
      }
    }
  }, [isTransitioning, initiateProgress])

  const startRouteTransition: StartRouteTransition = useCallback(
    (callback?: () => void) => {
      startTransition(() => {
        setIsTransitioning(true)

        if (typeof callback === 'function') {
          callback()
        }
      })
    },
    [setIsTransitioning],
  )

  return (
    <RouteTransitionContext.Provider
      value={{ isTransitioning, startRouteTransition, transitionProgress }}
    >
      {children}
    </RouteTransitionContext.Provider>
  )
}

type RouteTransitionProps = {
  children: React.ReactNode
}

type StartRouteTransition = (callback?: () => void) => void

type RouteTransitionContextValue = {
  isTransitioning: boolean
  startRouteTransition: StartRouteTransition
  transitionProgress: number
}

const RouteTransitionContext = React.createContext<RouteTransitionContextValue>({
  isTransitioning: false,
  startRouteTransition: () => undefined,
  transitionProgress: 0,
})

export const useRouteTransition = () => React.useContext(RouteTransitionContext)

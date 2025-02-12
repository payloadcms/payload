'use client'
import React, { useCallback, useEffect, useOptimistic, useRef } from 'react'

export const RouteTransitionProvider: React.FC<RouteTransitionProps> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useOptimistic(false)
  const [transitionProgress, setTransitionProgress] = React.useState(0)

  const transitionProgressRef = useRef(transitionProgress)

  const timerID = useRef(null)

  const startRouteTransition = useCallback(() => {
    setIsTransitioning(true)
    setTransitionProgress(0)

    // randomly update progress at random times, never reaching 100%
    timerID.current = setInterval(() => {
      const projectedProgress =
        transitionProgressRef.current + Math.random() * 0.1 * (1 - transitionProgressRef.current)

      const newProgress = projectedProgress >= 1 ? 1 : projectedProgress

      setTransitionProgress(newProgress)
      transitionProgressRef.current = newProgress
    }, 250) // every n ms, update progress
  }, [setIsTransitioning])

  useEffect(() => {
    if (!isTransitioning) {
      setTransitionProgress(0)
      transitionProgressRef.current = 0

      if (timerID.current) {
        clearInterval(timerID.current)
      }
    }
  }, [isTransitioning, setIsTransitioning])

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

type RouteTransitionContextValue = {
  isTransitioning: boolean
  startRouteTransition: () => void
  transitionProgress: number
}

const RouteTransitionContext = React.createContext<RouteTransitionContextValue>({
  isTransitioning: false,
  startRouteTransition: () => undefined,
  transitionProgress: 0,
})

export const useRouteTransition = () => React.useContext(RouteTransitionContext)

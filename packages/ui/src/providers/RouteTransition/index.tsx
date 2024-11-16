import React, { startTransition, useCallback, useEffect, useOptimistic, useRef } from 'react'

export const RouteTransition: React.FC<RouteTransitionProps> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useOptimistic(false)
  const [transitionProgress, setTransitionProgress] = React.useState(0)

  const timerID = useRef(null)

  const startRouteTransition = useCallback(() => {
    setTransitionProgress(0)

    // randomly update progress at random times, never reaching 100%
    timerID.current = setInterval(() => {
      setTransitionProgress((prevProgress) => {
        console.log('update')
        const newProgress = prevProgress + Math.random() * 0.1
        return newProgress > 1 ? 1 : newProgress
      })
    }, 500) // every n ms, update progress

    setIsTransitioning(true)
  }, [setIsTransitioning])

  useEffect(() => {
    let clearTimerID: NodeJS.Timeout
    const transitionTimerID = timerID.current

    if (isTransitioning && transitionTimerID) {
      // let go for another n ms before to avoid flickering
      clearTimerID = setTimeout(() => {
        if (timerID.current) {
          clearInterval(timerID.current)
        }

        // startTransition(() => {
        // setIsTransitioning(false)
        // })
      }, 2000)

      setTransitionProgress(0)
    }

    return () => {
      if (clearTimerID) {
        clearTimeout(clearTimerID)
      }

      //   if (isTransitioning && transitionTimerID) {
      //     console.log('CLEANUP')
      //     clearInterval(transitionTimerID)
      //   }
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
